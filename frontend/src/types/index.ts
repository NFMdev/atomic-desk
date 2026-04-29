export interface Space {
    id: number;
    name: string;
    type: "Desk" | "MeetingRoom";
    status?: "available" | "locked" | "booked";
}

export interface ReservationLockPayload {
    spaceId: number;
    startTime: string;
    endTime: string;
    idempotencyKey?: string;
}

export interface ReservationResponse {
    status: "created" | "cached";
    data: {
        id: number;
        locked_until: string;
    }
}

export interface ActiveReservation {
    id: number;
    locked_until: string;
    idempotencyKey: string;
}
