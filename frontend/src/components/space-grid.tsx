import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useLockSpace, useSpaces } from "../hooks/use-spaces";
import { Lock, Monitor, Users } from "lucide-react";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const SpaceGrid = () => {
    const { data: spaces, isLoading } = useSpaces();
    const lockMutation = useLockSpace();

    if (isLoading) return <div className="p-10 text-center">Loading Office Map...</div>

    const handleBooking = (spaceId: number) => {
        lockMutation.mutate({
            spaceId,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            {spaces?.map((space) => {
                const isLocked = lockMutation.isPaused && lockMutation.variables?.spaceId === space.id

                return (
                    <button
                        key={space.id}
                        onClick={() => handleBooking(space.id)}
                        disabled={isLocked}
                        className={cn(
                            "relative p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3",
                            "hover:shadow-lg active:scale-95",
                            space.attributes.type === 'MeetingRoom' ? 'bg-slate-50 border-slate-200' : "bg-white border-blue-50",
                            isLocked && "opacity-50 cursor-wait bg-amber-50 border-amber-300"
                        )}
                    >
                        {space.attributes.type === 'MeetingRoom' ? <Users size={32} /> : <Monitor size={32} />}
                        <span className="font-bold">{space.attributes.name}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">{space.attributes.type}</span>

                        {isLocked && (
                            <div className="absolute top-2 right-2 text-amber-600">
                                <Lock size={16} className="animate-pulse" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};