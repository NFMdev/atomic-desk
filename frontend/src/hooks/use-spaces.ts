import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { type ReservationResponse, type ReservationLockPayload, type Space } from "../types";

const SPACES_QUERY_KEY = ["spaces"];
const RESERVATION_ENDPOINTS = {
    confirm: "/reservations/confirm",
    lock: "/reservations/lock",
    unlock: "/reservations/unlock",
} as const;

export const useSpaces = () => {
    return useQuery({
        queryKey: SPACES_QUERY_KEY,
        queryFn: async () => {
            const { data } = await api.get("/spaces?populate=*");
            return data.data as Space[];
        },
        staleTime: 60 * 1000,
    });
};

export const useLockSpace = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ReservationLockPayload) => {
            const { idempotencyKey, ...reservationWindow } = payload;
            const key = idempotencyKey ?? crypto.randomUUID();

            const { data } = await api.post<ReservationResponse>(
                RESERVATION_ENDPOINTS.lock,
                reservationWindow,
                { headers: { "x-idempotency-key": key } }
            );
            return { ...data, idempotencyKey: key };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SPACES_QUERY_KEY });
        }
    });
};

export const useConfirmReservation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (idempotencyKey: string) => {
            const { data } = await api.post(
                RESERVATION_ENDPOINTS.confirm,
                {},
                { headers: { "x-idempotency-key": idempotencyKey } }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SPACES_QUERY_KEY });
        }
    });
};

export const useUnlockSpace = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (idempotencyKey: string) => {
            const { data } = await api.post(
                RESERVATION_ENDPOINTS.unlock,
                {},
                { headers: { "x-idempotency-key": idempotencyKey } }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SPACES_QUERY_KEY });
        }
    });
};
