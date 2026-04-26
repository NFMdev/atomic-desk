import { factories } from '@strapi/strapi';
import crypto from 'crypto';

export default factories.createCoreService('api::reservation.reservation', ({ strapi }) => ({
    async createLockTransaction(spaceId: number, startTime: string, endTime: string, idempotencyKey: string) {
        const knex = strapi.db.connection;

        return await knex.transaction(async (trx) => {
            // Idempotency check
            const existing = await trx('reservations').where({ idempotency_key: idempotencyKey }).first();
            if (existing) {
                return { status: 'cached', data: existing };
            }

            // Pessimistic Lock
            const space = await trx('spaces').where({ id: spaceId }).forUpdate().first();
            if (!space) throw new Error('Space not found');

            // Conflict Check
            const overlapping = await trx('reservations')
                .join('reservations_space_lnk', 'reservations.id', 'reservations_space_lnk.reservation_id')
                .where('reservations_space_lnk.space_id', spaceId)
                .whereIn('reservations.reservation_status', ['CONFIRMED', 'PENDING_LOCK'])
                .andWhere((builder) => {
                    builder.
                        whereBetween('reservations.start_time', [startTime, endTime])
                        .orWhereBetween('reservations.end_time', [startTime, endTime])
                })
                .first();

            if (overlapping) throw new Error('TIME_SLOT_UNAVAILABLE');

            // Create Lock
            const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);

            const [newReservation] = await trx('reservations').insert({
                document_id: crypto.randomUUID(),
                start_time: startTime,
                end_time: endTime,
                reservation_status: 'PENDING_LOCK',
                idempotency_key: idempotencyKey,
                locked_until: lockedUntil,
                published_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            }).returning('*');
            await trx('reservations_space_lnk').insert({
                reservation_id: newReservation.id,
                space_id: spaceId
            });

            return { status: 'created', data: newReservation };
        });
    },
    async confirmPayment(idempotencyKey: string) {
        const knex = strapi.db.connection;

        const result = await knex.transaction(async (trx) => {
            // Lock the row to prevent race conditions during confirmation
            const reservation = await trx('reservations')
                .where({ idempotency_key: idempotencyKey })
                .forUpdate()
                .first();

            if (!reservation) throw new Error('RESERVATION_NOT_FOUND');

            // Idempotency Check
            if (reservation.reservation_status === 'CONFIRMED') {
                return { status: 'already_confirmed', data: reservation };
            }
            // Expiration Check
            if (reservation.reservation_status === 'PENDING_LOCK' && new Date(reservation.locked_until) < new Date()) {
                throw new Error("LOCK_EXPIRED");
            }
            // Update state to CONFIRMED
            const [confirmedReservation] = await trx('reservations')
                .where({ idempotency_key: idempotencyKey })
                .update({
                    reservation_status: 'CONFIRMED',
                    updated_at: new Date()
                })
                .returning('*');

            return { status: 'confirmed', data: confirmedReservation };
        });

        return result;
    }
}));