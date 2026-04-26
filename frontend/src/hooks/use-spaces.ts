import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { type ReservationResponse, type ReservationLockPayload, type Space } from "../types";


const api = axios.create({ baseURL: 'http://localhost:1337/api' });

export const useSpaces = () => {
    return useQuery({
        queryKey: ['spaces'],
        queryFn: async () => {
            const { data } = await api.get('/spaces?populate=*');
            return data.data as Space[];
        },
    });
};

export const useLockSpace = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ReservationLockPayload) => {
            // Generate idempotent key
            const key = crypto.randomUUID();

            const { data } = await api.post<ReservationResponse>(
                '/reservations/lock',
                payload,
                { headers: { 'x-idempotency-key': key } }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spaces'] });
        }
    });
}