import { useState, type MouseEvent } from "react";
import { isAxiosError } from "axios";
import { type ActiveReservation, type Space } from "../types";
import { Monitor, Users, ChevronDown, ChevronUp, CheckCircle2, Clock, MapPin, WalletCards } from "lucide-react";
import { useLockSpace } from "../hooks/use-spaces";
import { cn } from "../lib/cn";

interface SpaceCardProps {
    space: Space;
    onSelect: (space: Space, reservation: ActiveReservation) => void;
}

const getSpaceFeatures = (isMeetingRoom: boolean) => [
    isMeetingRoom ? "Up to 6 people" : "Single User Setup",
    isMeetingRoom ? "Whiteboard & Projector" : "Dual Monitor & Ergonomic Chair",
    "Power & High-Speed WiFi",
];

const getSpaceDetails = (isMeetingRoom: boolean) => ({
    capacity: isMeetingRoom ? "Up to 6" : "1 person",
    location: isMeetingRoom ? "North lounge" : "Main floor",
    price: "$15 / hour",
});

const getAvailabilityLabel = (status?: Space["status"]) => {
    if (status === "booked") return "Booked";
    if (status === "locked") return "On hold";
    return "Available";
};

const getReservationErrorMessage = (error: unknown) => {
    if (isAxiosError<{ error?: { message?: string } }>(error)) {
        return error.response?.data?.error?.message ?? error.message;
    }

    if (error instanceof Error) return error.message;

    return "Failed to lock space. It may have just been booked.";
};

export const SpaceCard = ({ space, onSelect }: SpaceCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const lockMutation = useLockSpace();

    const isMeetingRoom = space.type === "MeetingRoom";
    const features = getSpaceFeatures(isMeetingRoom);
    const details = getSpaceDetails(isMeetingRoom);
    const availabilityLabel = getAvailabilityLabel(space.status);

    const handleSelect = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        lockMutation.mutate({
            spaceId: space.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
        }, {
            onSuccess: (data) => {
                if (data.status === "created" || data.status === "cached") {
                    onSelect(space, {
                        id: data.data.id,
                        locked_until: data.data.locked_until,
                        idempotencyKey: data.idempotencyKey,
                    });
                }
            },
            onError: (err) => {
                alert(getReservationErrorMessage(err));
            }
        });
    };

    const collapseCard = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setIsExpanded(false);
    };

    return (
        <div
            onClick={() => !isExpanded && setIsExpanded(true)}
            className={cn(
                "workspace-card group relative flex flex-col overflow-hidden transition duration-300",
                "hover:-translate-y-1 hover:border-atomic-accent hover:shadow-lift",
                isExpanded ? "border-atomic-accent bg-atomic-white shadow-lift" : "cursor-pointer bg-atomic-white/88",
                isExpanded ? "col-span-1 md:col-span-2 row-span-2" : ""
            )}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-atomic-border via-atomic-accent to-atomic-accentDark" />

            <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
                <div className="flex min-w-0 flex-col gap-4">
                    <div className={cn(
                        "inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition duration-300",
                        isExpanded
                            ? "border-atomic-accent bg-atomic-accentDark text-white"
                            : "border-atomic-border/45 bg-atomic-canvas/55 text-atomic-accentDark group-hover:border-atomic-accent"
                    )}>
                        {isMeetingRoom ? <Users size={28} /> : <Monitor size={28} />}
                    </div>
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-atomic-canvas px-2.5 py-1 text-xs font-bold text-atomic-accentDark">
                                {availabilityLabel}
                            </span>
                            <span className="text-xs font-semibold uppercase text-atomic-muted">{space.type}</span>
                        </div>
                        <h3 className="truncate text-xl font-bold text-atomic-ink">{space.name}</h3>
                        <div className="mt-3 grid gap-2 text-sm text-atomic-muted">
                            <span className="flex items-center gap-2">
                                <MapPin size={15} aria-hidden="true" />
                                {details.location}
                            </span>
                            <span className="flex items-center gap-2">
                                <Users size={15} aria-hidden="true" />
                                {details.capacity}
                            </span>
                        </div>
                    </div>
                </div>

                {isExpanded ? (
                    <button
                        onClick={collapseCard}
                        className="rounded-full p-2 text-atomic-muted transition hover:bg-atomic-canvas hover:text-atomic-ink"
                        aria-label="Collapse space details"
                    >
                        <ChevronUp size={20} />
                    </button>
                ) : (
                    <div className="rounded-full p-2 text-atomic-border transition-colors group-hover:bg-atomic-canvas group-hover:text-atomic-accentDark">
                        <ChevronDown size={20} />
                    </div>
                )}
            </div>

            <div className="mt-auto grid grid-cols-2 border-y border-atomic-border/35 bg-atomic-surface/60 text-sm">
                <div className="flex items-center gap-2 border-r border-atomic-border/35 px-5 py-3 text-atomic-muted">
                    <Clock size={15} aria-hidden="true" />
                    1 hour
                </div>
                <div className="flex items-center gap-2 px-5 py-3 font-bold text-atomic-ink">
                    <WalletCards size={15} aria-hidden="true" />
                    {details.price}
                </div>
            </div>

            <div className={cn(
                "flex flex-col px-5 pb-5 pt-4 transition-all duration-300 sm:px-6 sm:pb-6",
                isExpanded ? "opacity-100" : "opacity-0 h-0 hidden"
            )}>
                <div className="flex flex-1 flex-col justify-between">
                    <div className="mb-6 space-y-3">
                        {features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm text-atomic-muted">
                                <CheckCircle2 size={16} className="text-atomic-accentDark" />
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSelect}
                        disabled={lockMutation.isPending}
                        className="workspace-btn-primary w-full"
                    >
                        {lockMutation.isPending ? "Locking..." : "Select Space"}
                    </button>
                </div>
            </div>
        </div>
    );
};
