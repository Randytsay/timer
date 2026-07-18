export function formatTimerParts(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    return {
        minutes: Math.floor(seconds / 60).toString().padStart(2, '0'),
        seconds: (seconds % 60).toString().padStart(2, '0')
    };
}

export function formatClockParts(date = new Date()) {
    return {
        hours: date.getHours().toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
        seconds: date.getSeconds().toString().padStart(2, '0')
    };
}
