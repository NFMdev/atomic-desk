export interface Space {
    id: number;
    attributes: {
        name: string;
        type: 'HotDesk' | 'MeetingRoom';
        status?: 'available' | 'locked' | 'booked';
    };
}

export interface ReservationLockPayload {
    spaceId: number;
    startTime: string;
    endTime: string;
}

export interface ReservationResponse {
    status: 'created' | 'cached';
    data: {
        id: number;
        locked_until: string;
    }
}