import { factories } from '@strapi/strapi';

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
                .where({ space_id: spaceId })
                .whereIn('status', ['CONFIRMED', 'PENDING_LOCK'])
                .andWhere((builder) => {
                    builder.
                        whereBetween('start_time', [startTime, endTime])
                        .orWhereBetween('end_time', [startTime, endTime])
                })
                .first();

            if (overlapping) throw new Error('TIME_SLOT_UNAVAILABLE');

            // Create Lock
            const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);

            const [newReservation] = await trx('reservations').insert({
                space_id: spaceId,
                start_time: startTime,
                end_time: endTime,
                status: 'LOCKED',
                idempotency_key: idempotencyKey,
                locked_until: lockedUntil,
                created_at: new Date(),
                updated_at: new Date()
            }).returning('*');

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
            if (reservation.status === 'CONFIRMED') {
                return { status: 'already_confirmed', data: reservation };
            }
            // Expiration Check
            if (reservation.status === 'PENDING_LOCK' && new Date(reservation.locked_until) < new Date()) {
                throw new Error("LOCK_EXPIRED");
            }
            // Update state to CONFIRMED
            const [confirmedReservation] = await trx('reservations')
                .where({ idempotency_key: idempotencyKey })
                .update({
                    status: 'CONFIRMED',
                    updated_at: new Date()
                })
                .returning('*');

            return { status: 'confirmed', data: confirmedReservation };
        });

        return result;
    }
}));