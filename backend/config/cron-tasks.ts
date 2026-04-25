export default {
    '*/1 * * * *': async ({ strapi }) => {
        const knex = strapi.db.connection;
        const now = new Date();

        try {
            const updatedCount = await knex('reservations')
                .where('status', 'PENDING_LOCK')
                .andWhere('locked_until', '<', now)
                .update({
                    status: 'RELEASED',
                    updated_at: now
                });

            if (updatedCount > 0) {
                strapi.log.info(`Heartbeat: Released ${updatedCount} expired space locks.`);
                // TODO: Broadcast release events to clients
            }
        } catch (error) {
            strapi.log.error('Heartbeat: Failed to release locks', error);
        }
    },
};