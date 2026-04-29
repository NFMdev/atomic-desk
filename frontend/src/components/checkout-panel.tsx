import { useEffect } from "react";
import { useCountdown } from "../hooks/use-countdown";
import { useConfirmReservation, useUnlockSpace } from "../hooks/use-spaces";
import { type ActiveReservation } from "../types";
import { AlertTriangle, CheckCircle2, TimerReset } from "lucide-react";

interface CheckoutPanelProps {
    reservation: ActiveReservation;
    onClear: () => void;
}

export const CheckoutPanel = ({ reservation, onClear }: CheckoutPanelProps) => {
    const { formattedTime, isExpired } = useCountdown(reservation.locked_until);
    const confirmMutation = useConfirmReservation();
    const unlockMutation = useUnlockSpace();

    const releaseReservation = () => {
        unlockMutation.mutate(reservation.idempotencyKey);
        onClear();
    };

    useEffect(() => {
        if (confirmMutation.isSuccess) {
            const timer = setTimeout(() => onClear(), 2000);
            return () => clearTimeout(timer);
        }
    }, [confirmMutation.isSuccess, onClear]);

    if (confirmMutation.isSuccess) return (
        <div className="rounded-card border border-atomic-success/35 bg-atomic-surface p-6 text-center shadow-insetWarm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-atomic-success text-white">
                <CheckCircle2 size={24} aria-hidden="true" />
            </div>
            <p className="text-lg font-bold text-atomic-ink">Reservation Confirmed!</p>
            <p className="mt-1 text-sm text-atomic-muted">
                Your space is now booked.
            </p>
        </div>
    );

    if (isExpired) return (
        <div className="flex flex-col items-center gap-3 rounded-card border border-atomic-danger/35 bg-atomic-surface p-6 text-center shadow-insetWarm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-atomic-danger text-white">
                <AlertTriangle size={23} aria-hidden="true" />
            </div>
            <p className="text-lg font-bold text-atomic-ink">Lock Expired</p>
            <p className="text-sm text-atomic-muted">
                Please reserve a new space.
            </p>
            <button
                onClick={releaseReservation}
                className="workspace-btn-secondary mt-1"
            >
                Dismiss
            </button>
        </div>
    );

    return (
        <div className="flex flex-col gap-5 rounded-card border border-atomic-border/45 bg-atomic-canvas/80 p-5 shadow-insetWarm md:flex-row md:items-center md:justify-between sm:p-6">
            <div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-atomic-accentDark text-white">
                    <TimerReset size={20} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-atomic-ink">Check-Out</h3>
                <p className="mt-1 text-sm text-atomic-muted">Please complete your payment to confirm.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-control border border-atomic-border/45 bg-atomic-white px-5 py-3 text-center shadow-insetWarm">
                    <p className="text-xs font-semibold uppercase text-atomic-muted">Hold expires</p>
                    <p className="font-mono text-3xl font-bold text-atomic-ink">{formattedTime}</p>
                </div>
                <button
                    onClick={() => confirmMutation.mutate(reservation.idempotencyKey)}
                    disabled={confirmMutation.isPending}
                    className="workspace-btn-primary px-8"
                >
                    {confirmMutation.isPending ? "Confirming..." : "Check-Out"}
                </button>
            </div>
        </div>
    );
};
