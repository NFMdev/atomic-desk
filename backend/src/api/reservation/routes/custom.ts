export default {
    routes: [
        {
            method: 'POST',
            path: '/reservations/lock',
            handler: 'reservation.lockSpace',
            config: { auth: false },
        },
        {
            method: 'POST',
            path: '/reservations/confirm',
            handler: 'reservation.confirmPayment',
            config: { auth: false },
        },
    ],
};