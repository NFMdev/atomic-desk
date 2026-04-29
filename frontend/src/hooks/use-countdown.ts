import { useEffect, useState } from "react";

export const useCountdown = (targetDateString?: string | null) => {
    const calculateTimeLeft = (targetDate: string | null | undefined, currentTime: number) => {
        if (!targetDate) return 0;
        const targetTime = new Date(targetDate).getTime();
        const diff = targetTime - currentTime;
        return diff > 0 ? diff : 0;
    };

    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        if (!targetDateString) return;

        const refreshCurrentTime = () => setCurrentTime(Date.now());
        const timeout = window.setTimeout(refreshCurrentTime, 0);
        const interval = window.setInterval(() => {
            refreshCurrentTime();
        }, 1000);

        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(interval);
        };
    }, [targetDateString]);

    const timeLeft = calculateTimeLeft(targetDateString, currentTime);
    const totalSeconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return {
        formattedTime,
        isExpired: timeLeft <= 0 && !!targetDateString
    };
};
