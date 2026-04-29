import { factories } from '@strapi/strapi';
import type { Context } from 'koa';
import { RESERVATION_ERRORS } from '../services/reservation';

const getHeaderValue = (header: string | string[] | undefined) => {
    if (Array.isArray(header)) return header[0];
    return header;
};

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : undefined;
};

const handleReservationError = (ctx: Context, strapi, error: unknown, fallbackMessage: string) => {
    switch (getErrorMessage(error)) {
        case RESERVATION_ERRORS.invalidReservationWindow:
            return ctx.badRequest('Reservation start time must be before end time.');
        case RESERVATION_ERRORS.lockExpired:
            return ctx.badRequest('Reservation lock has expired. Please restart the reservation process.');
        case RESERVATION_ERRORS.reservationNotFound:
            return ctx.notFound('Reservation not found.');
        case RESERVATION_ERRORS.spaceNotFound:
            return ctx.notFound('Space does not exist.');
        case RESERVATION_ERRORS.timeSlotUnavailable:
            return ctx.conflict('This space is already locked or booked for the selected time slot.');
        default:
            strapi.log.error('Reservation request failed', error);
            return ctx.internalServerError(fallbackMessage);
    }
};

export default factories.createCoreController('api::reservation.reservation', ({ strapi }) => ({
    async lockSpace(ctx: Context) {
        const { spaceId, startTime, endTime } = ctx.request.body;
        const idempotencyKey = getHeaderValue(ctx.request.headers['x-idempotency-key']);
        const normalizedSpaceId = Number(spaceId);

        if (!Number.isInteger(normalizedSpaceId) || normalizedSpaceId <= 0 || !startTime || !endTime || !idempotencyKey) {
            return ctx.badRequest('Missing required fields');
        }

        try {
            const result = await strapi.service('api::reservation.reservation').createLockTransaction(
                normalizedSpaceId,
                startTime,
                endTime,
                idempotencyKey
            );

            return ctx.send(result);
        } catch (error) {
            return handleReservationError(ctx, strapi, error, 'An error occurred processing the reservation.');
        }
    },
    async unlockSpace(ctx: Context) {
        const idempotencyKey = getHeaderValue(ctx.request.headers['x-idempotency-key']);

        if (!idempotencyKey) return ctx.badRequest('Missing idempotency key');

        try {
            const result = await strapi.service('api::reservation.reservation').unlockSpace(idempotencyKey);

            return ctx.send(result);
        } catch (error) {
            return handleReservationError(ctx, strapi, error, 'Reservation unlock failed.');
        }
    },
    async confirmPayment(ctx: Context) {
        const idempotencyKey = getHeaderValue(ctx.request.headers['x-idempotency-key']);

        if (!idempotencyKey) return ctx.badRequest('Missing idempotency key');

        try {
            const result = await strapi.service('api::reservation.reservation').confirmPayment(idempotencyKey);

            // TODO: Implement Socket.io event -> strapi.io.emit('reservation:confirmed', ...);


            return ctx.send(result);
        } catch (error) {
            return handleReservationError(ctx, strapi, error, 'Payment confirmation failed.');
        }
    }
}));
