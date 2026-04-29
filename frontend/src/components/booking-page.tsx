import { type Space, type ActiveReservation } from "../types";
import { useUnlockSpace } from "../hooks/use-spaces";
import { CheckoutPanel } from "./checkout-panel";
import { ArrowLeft, CalendarDays, Clock3, DoorOpen, WalletCards } from "lucide-react";

interface BookingPageProps {
    space: Space;
    reservation: ActiveReservation;
    onCancel: () => void;
    onBookingComplete: () => void;
}

export const BookingPage = ({ space, reservation, onCancel, onBookingComplete }: BookingPageProps) => {
    const unlockMutation = useUnlockSpace();

    const handleCancel = () => {
        unlockMutation.mutate(reservation.idempotencyKey);
        onCancel();
    };

    return (
        <div className="mx-auto max-w-4xl">
            <button
                onClick={handleCancel}
                className="workspace-btn-secondary mb-6 gap-2"
            >
                <ArrowLeft size={18} aria-hidden="true" />
                Back to spaces
            </button>

            <div className="workspace-card overflow-hidden">
                <div className="border-b border-atomic-border/45 bg-atomic-surface-muted p-6 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-atomic-accentDark">Booking checkout</p>
                            <h2 className="mt-2 text-3xl font-bold text-atomic-ink">Complete your booking</h2>
                            <p className="mt-2 text-sm text-atomic-muted sm:text-base">
                                You selected <strong className="text-atomic-ink">{space.name}</strong> ({space.type}).
                            </p>
                        </div>
                        <span className="workspace-pill w-fit bg-atomic-white">Pending hold</span>
                    </div>
                </div>

                <div className="p-5 sm:p-8">
                    <div className="space-y-6">
                        <div className="rounded-card border border-atomic-border/45 bg-atomic-surface/80 p-5 sm:p-6">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase text-atomic-accentDark">Selected slot</p>
                                    <h3 className="mt-1 text-xl font-bold text-atomic-ink">Reservation summary</h3>
                                </div>
                                <span className="workspace-pill w-fit">Available now</span>
                            </div>

                            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-2xl border border-atomic-border/35 bg-atomic-white p-4">
                                    <DoorOpen className="mb-3 text-atomic-accentDark" size={18} aria-hidden="true" />
                                    <p className="mb-1 text-xs font-semibold uppercase text-atomic-muted">Space</p>
                                    <p className="font-bold text-atomic-ink">{space.name}</p>
                                </div>
                                <div className="rounded-2xl border border-atomic-border/35 bg-atomic-white p-4">
                                    <CalendarDays className="mb-3 text-atomic-accentDark" size={18} aria-hidden="true" />
                                    <p className="mb-1 text-xs font-semibold uppercase text-atomic-muted">Type</p>
                                    <p className="font-bold text-atomic-ink">{space.type}</p>
                                </div>
                                <div className="rounded-2xl border border-atomic-border/35 bg-atomic-white p-4">
                                    <Clock3 className="mb-3 text-atomic-accentDark" size={18} aria-hidden="true" />
                                    <p className="mb-1 text-xs font-semibold uppercase text-atomic-muted">Duration</p>
                                    <p className="font-bold text-atomic-ink">1 Hour</p>
                                </div>
                                <div className="rounded-2xl border border-atomic-border/35 bg-atomic-white p-4">
                                    <WalletCards className="mb-3 text-atomic-accentDark" size={18} aria-hidden="true" />
                                    <p className="mb-1 text-xs font-semibold uppercase text-atomic-muted">Total</p>
                                    <p className="font-mono font-bold text-atomic-ink">$15.00</p>
                                </div>
                            </div>
                        </div>

                        <CheckoutPanel
                            reservation={reservation}
                            onClear={onBookingComplete}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
