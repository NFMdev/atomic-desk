import { useSpaces } from "../hooks/use-spaces";
import { type Space, type ActiveReservation } from "../types";
import { SpaceCard } from "./space-card";
import { Armchair, Loader2 } from "lucide-react";

export const SpaceGrid = ({ onSelect }: { onSelect: (space: Space, res: ActiveReservation) => void }) => {
    const { data: spaces, isLoading } = useSpaces();

    if (isLoading) return (
        <div className="workspace-section flex flex-col items-center justify-center gap-4 px-6 py-20 text-center text-atomic-muted">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-atomic-border/50 bg-atomic-white shadow-soft">
                <Loader2 className="animate-spin text-atomic-accentDark" size={26} aria-hidden="true" />
            </div>
            <div>
                <p className="text-sm font-bold uppercase text-atomic-accentDark">Loading office map</p>
                <p className="mt-1 text-sm">Checking the latest workspace availability.</p>
            </div>
        </div>
    );

    return (
        <section className="space-y-6">
            <div className="workspace-section p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-atomic-accentDark text-white shadow-soft">
                            <Armchair size={22} aria-hidden="true" />
                        </div>
                        <h2 className="text-2xl font-bold text-atomic-ink sm:text-3xl">Choose your workspace</h2>
                        <p className="mt-2 max-w-2xl text-sm text-atomic-muted sm:text-base">
                            Browse available rooms and desks, then hold a slot while you complete checkout.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm sm:flex">
                        <span className="workspace-pill">Open now</span>
                        <span className="workspace-pill">{spaces?.length ?? 0} spaces</span>
                    </div>
                </div>
            </div>

            {spaces?.length ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {spaces.map((space) => (
                        <SpaceCard key={space.id} space={space} onSelect={onSelect} />
                    ))}
                </div>
            ) : (
                <div className="workspace-card px-6 py-14 text-center">
                    <p className="text-lg font-bold text-atomic-ink">No spaces available</p>
                    <p className="mt-2 text-sm text-atomic-muted">Please check back shortly for new openings.</p>
                </div>
            )}
        </section>
    );
};
