export const DEFAULT_TIME_SECONDS = 300;
export const MIN_TIME_SECONDS = 1;
export const MAX_TIME_SECONDS = 5999;

export const TIMER_STATUS = Object.freeze({
    IDLE: 'IDLE',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    FINISHED: 'FINISHED'
});

export function clampTimerSeconds(value, fallback = DEFAULT_TIME_SECONDS) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds)) return fallback;
    return Math.min(MAX_TIME_SECONDS, Math.max(MIN_TIME_SECONDS, Math.round(seconds)));
}

export function remainingSecondsAt(endTimestamp, now = Date.now()) {
    return Math.max(0, Math.ceil((endTimestamp - now) / 1000));
}

export class TimerEngine {
    constructor(totalSeconds = DEFAULT_TIME_SECONDS) {
        const duration = clampTimerSeconds(totalSeconds);
        this.totalSeconds = duration;
        this.remainingSeconds = duration;
        this.endTimestamp = null;
        this.finishedAt = null;
        this.status = TIMER_STATUS.IDLE;
    }

    setDuration(seconds) {
        const duration = clampTimerSeconds(seconds);
        this.totalSeconds = duration;
        this.remainingSeconds = duration;
        this.endTimestamp = null;
        this.finishedAt = null;
        this.status = TIMER_STATUS.IDLE;
        return this.snapshot();
    }

    start(now = Date.now()) {
        if (this.status === TIMER_STATUS.RUNNING || this.remainingSeconds <= 0) return this.snapshot();
        this.status = TIMER_STATUS.RUNNING;
        this.finishedAt = null;
        this.endTimestamp = now + this.remainingSeconds * 1000;
        return this.snapshot();
    }

    tick(now = Date.now()) {
        if (this.status !== TIMER_STATUS.RUNNING || this.endTimestamp === null) return this.snapshot();

        this.remainingSeconds = remainingSecondsAt(this.endTimestamp, now);
        if (this.remainingSeconds === 0) {
            this.status = TIMER_STATUS.FINISHED;
            this.finishedAt = this.endTimestamp;
            this.endTimestamp = null;
        }
        return this.snapshot();
    }

    pause(now = Date.now()) {
        if (this.status !== TIMER_STATUS.RUNNING) return this.snapshot();
        this.tick(now);
        if (this.status === TIMER_STATUS.RUNNING) {
            this.status = TIMER_STATUS.PAUSED;
            this.endTimestamp = null;
        }
        return this.snapshot();
    }

    adjustDuration(deltaSeconds) {
        if (this.status === TIMER_STATUS.RUNNING || this.status === TIMER_STATUS.FINISHED) return this.snapshot();

        const nextTotalSeconds = clampTimerSeconds(this.totalSeconds + deltaSeconds);
        const appliedDelta = nextTotalSeconds - this.totalSeconds;
        this.totalSeconds = nextTotalSeconds;
        this.remainingSeconds = this.status === TIMER_STATUS.PAUSED
            ? Math.min(this.totalSeconds, Math.max(MIN_TIME_SECONDS, this.remainingSeconds + appliedDelta))
            : this.totalSeconds;
        return this.snapshot();
    }

    reset() {
        this.remainingSeconds = this.totalSeconds;
        this.endTimestamp = null;
        this.finishedAt = null;
        this.status = TIMER_STATUS.IDLE;
        return this.snapshot();
    }

    finish(now = Date.now()) {
        this.remainingSeconds = 0;
        this.endTimestamp = null;
        this.finishedAt = now;
        this.status = TIMER_STATUS.FINISHED;
        return this.snapshot();
    }

    getOvertimeSeconds(now = Date.now()) {
        if (this.status !== TIMER_STATUS.FINISHED || this.finishedAt === null) return 0;
        return Math.max(0, Math.floor((now - this.finishedAt) / 1000));
    }

    snapshot() {
        return {
            totalSeconds: this.totalSeconds,
            remainingSeconds: this.remainingSeconds,
            endTimestamp: this.endTimestamp,
            finishedAt: this.finishedAt,
            status: this.status
        };
    }
}
