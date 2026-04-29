import { factories } from '@strapi/strapi';
import crypto from 'crypto';

const LOCK_DURATION_MS = 5 * 60 * 1000;

const TABLES = {
    reservations: 'reservations',
    reservationSpaceLinks: 'reservations_space_lnk',
    spaces: 'spaces',
} as const;

export const RESERVATION_ERRORS = {
    invalidReservationWindow: 'INVALID_RESERVATION_WINDOW',
    lockExpired: 'LOCK_EXPIRED',
    reservationNotFound: 'RESERVATION_NOT_FOUND',
    spaceNotFound: 'SPACE_NOT_FOUND',
    timeSlotUnavailable: 'TIME_SLOT_UNAVAILABLE',
} as const;

const RESERVATION_STATUS = {
    confirmed: 'CONFIRMED',
    pendingLock: 'PENDING_LOCK',
    released: 'RELEASED',
} as const;

const assertValidReservationWindow = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        throw new Error(RESERVATION_ERRORS.invalidReservationWindow);
    }
};

export default factories.createCoreService('api::reservation.reservation', ({ strapi }) => ({
    async createLockTransaction(spaceId: number, startTime: string, endTime: string, idempotencyKey: string) {
        assertValidReservationWindow(startTime, endTime);

        const knex = strapi.db.connection;

        return await knex.transaction(async (trx) => {
            const existing = await trx(TABLES.reservations).where({ idempotency_key: idempotencyKey }).first();
            if (existing) {
                return { status: 'cached', data: existing };
            }

            const space = await trx(TABLES.spaces).where({ id: spaceId }).forUpdate().first();
            if (!space) throw new Error(RESERVATION_ERRORS.spaceNotFound);

            const currentTime = new Date();

            const overlapping = await trx(TABLES.reservations)
                .join(TABLES.reservationSpaceLinks, 'reservations.id', 'reservations_space_lnk.reservation_id')
                .where('reservations_space_lnk.space_id', spaceId)
                .where('reservations.start_time', '<', endTime)
                .where('reservations.end_time', '>', startTime)
                .andWhere((builder) => {
                    builder
                        .where('reservations.reservation_status', RESERVATION_STATUS.confirmed)
                        .orWhere((pendingLockBuilder) => {
                            pendingLockBuilder
                                .where('reservations.reservation_status', RESERVATION_STATUS.pendingLock)
                                .where('reservations.locked_until', '>', currentTime);
                        });
                })
                .first();

            if (overlapping) throw new Error(RESERVATION_ERRORS.timeSlotUnavailable);

            const lockedUntil = new Date(currentTime.getTime() + LOCK_DURATION_MS);

            const [newReservation] = await trx(TABLES.reservations).insert({
                document_id: crypto.randomUUID(),
                start_time: startTime,
                end_time: endTime,
                reservation_status: RESERVATION_STATUS.pendingLock,
                idempotency_key: idempotencyKey,
                locked_until: lockedUntil,
                published_at: currentTime,
                created_at: currentTime,
                updated_at: currentTime
            }).returning('*');
            await trx(TABLES.reservationSpaceLinks).insert({
                reservation_id: newReservation.id,
                space_id: spaceId
            });

            return { status: 'created', data: newReservation };
        });
    },
    async unlockSpace(idempotencyKey: string) {
        const knex = strapi.db.connection;

        const result = await knex.transaction(async (trx) => {
            const reservation = await trx(TABLES.reservations)
                .where({ idempotency_key: idempotencyKey })
                .forUpdate()
                .first();

            if (!reservation) throw new Error(RESERVATION_ERRORS.reservationNotFound);

            if (reservation.reservation_status !== RESERVATION_STATUS.pendingLock) {
                throw new Error(RESERVATION_ERRORS.lockExpired);
            }

            const [releasedReservation] = await trx(TABLES.reservations)
                .where({ idempotency_key: idempotencyKey })
                .update({
                    reservation_status: RESERVATION_STATUS.released,
                    updated_at: new Date()
                })
                .returning('*');

            return { status: 'released', data: releasedReservation };
        });

        return result;
    },
    async confirmPayment(idempotencyKey: string) {
        const knex = strapi.db.connection;

        const result = await knex.transaction(async (trx) => {
            const reservation = await trx(TABLES.reservations)
                .where({ idempotency_key: idempotencyKey })
                .forUpdate()
                .first();

            if (!reservation) throw new Error(RESERVATION_ERRORS.reservationNotFound);

            if (reservation.reservation_status === RESERVATION_STATUS.confirmed) {
                return { status: 'already_confirmed', data: reservation };
            }

            if (reservation.reservation_status !== RESERVATION_STATUS.pendingLock || new Date(reservation.locked_until) < new Date()) {
                throw new Error(RESERVATION_ERRORS.lockExpired);
            }

            const [confirmedReservation] = await trx(TABLES.reservations)
                .where({ idempotency_key: idempotencyKey })
                .update({
                    reservation_status: RESERVATION_STATUS.confirmed,
                    updated_at: new Date()
                })
                .returning('*');

            return { status: 'confirmed', data: confirmedReservation };
        });

        return result;
    }
}));
