import { factories } from '@strapi/strapi';
import type { Context } from 'koa';

export default factories.createCoreController('api::reservation.reservation', ({ strapi }) => ({
    async lockSpace(ctx: Context) {
        const { spaceId, startTime, endTime } = ctx.request.body;
        const idempotencyKey = ctx.request.headers['x-idempotency-key'];

        if (!spaceId || !startTime || !endTime || !idempotencyKey) {
            return ctx.badRequest('Missing required fields');
        }

        try {
            const result = await strapi.service("api::reservation.reservation").createLockTransaction(
                spaceId,
                startTime,
                endTime,
                idempotencyKey
            );

            return ctx.send(result);
        } catch (error) {
            if (error.message === 'TIME_SLOT_UNAVAILABLE') {
                return ctx.conflict("This space is already locked or booked for the selected time slot.");
            }
            if (error.message === "SPACE_NOT_FOUND") {
                return ctx.notFound("Space does not exist.");
            }

            return ctx.internalServerError("An error occurred processing the reservation.");
        }
    },
    async confirmPayment(ctx: Context) {
        const idempotencyKey = ctx.request.headers['x-idempotency-key'];

        if (!idempotencyKey) return ctx.badRequest('Missing idempotency key');

        try {
            const result = await strapi.service("api::reservation.reservation").confirmPayment(idempotencyKey);

            // TODO: Implement Socket.io event -> strapi.io.emit('reservation:confirmed', ...);


            return ctx.send(result);
        } catch (error) {
            if (error.message === 'RESERVATION_NOT_FOUND') return ctx.notFound("Reservation not found.");
            if (error.message === "LOCK_EXPIRED") return ctx.badRequest("Reservation lock has expired. Please restart the reservation process.");
            return ctx.internalServerError("Payment confirmation failed.");
        }
    }
}));

