import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_TIME_SECONDS,
    MAX_TIME_SECONDS,
    MIN_TIME_SECONDS,
    TIMER_STATUS,
    TimerEngine,
    clampTimerSeconds,
    remainingSecondsAt
} from '../../js/timer-engine.js';
import { formatClockParts, formatTimerParts } from '../../js/time-format.js';

test('clamps timer duration to one consistent range', () => {
    assert.equal(clampTimerSeconds(-3), MIN_TIME_SECONDS);
    assert.equal(clampTimerSeconds(MAX_TIME_SECONDS + 1), MAX_TIME_SECONDS);
    assert.equal(clampTimerSeconds('not-a-number'), DEFAULT_TIME_SECONDS);
    assert.equal(clampTimerSeconds(12.6), 13);
});

test('formats timer and clock values with leading zeroes', () => {
    assert.deepEqual(formatTimerParts(65), { minutes: '01', seconds: '05' });
    assert.deepEqual(formatTimerParts(0), { minutes: '00', seconds: '00' });
    assert.deepEqual(formatClockParts(new Date(2026, 0, 1, 8, 3, 9)), {
        hours: '08', minutes: '03', seconds: '09'
    });
});

test('calculates remaining seconds from the real deadline', () => {
    assert.equal(remainingSecondsAt(11_000, 1_001), 10);
    assert.equal(remainingSecondsAt(11_000, 2_000), 9);
    assert.equal(remainingSecondsAt(11_000, 11_100), 0);
});

test('starts, pauses, and resumes without restoring elapsed time', () => {
    const engine = new TimerEngine(300);
    engine.start(1_000);
    engine.pause(61_000);

    assert.equal(engine.status, TIMER_STATUS.PAUSED);
    assert.equal(engine.remainingSeconds, 240);
    assert.equal(engine.endTimestamp, null);

    engine.start(100_000);
    assert.equal(engine.endTimestamp, 340_000);
});

test('adjusts paused time from remaining time instead of restoring the timer', () => {
    const engine = new TimerEngine(300);
    engine.start(0);
    engine.pause(120_000);
    engine.adjustDuration(30);

    assert.equal(engine.totalSeconds, 330);
    assert.equal(engine.remainingSeconds, 210);

    engine.adjustDuration(-60);
    assert.equal(engine.totalSeconds, 270);
    assert.equal(engine.remainingSeconds, 150);
});

test('prevents changes while running and resets to the configured total', () => {
    const engine = new TimerEngine(90);
    engine.start(0);
    engine.adjustDuration(30);
    assert.equal(engine.totalSeconds, 90);

    engine.pause(30_000);
    engine.reset();
    assert.deepEqual(engine.snapshot(), {
        totalSeconds: 90,
        remainingSeconds: 90,
        endTimestamp: null,
        finishedAt: null,
        status: TIMER_STATUS.IDLE
    });
});

test('provides overtime-ready elapsed seconds after a timer finishes', () => {
    const engine = new TimerEngine(5);
    engine.start(1_000);
    engine.tick(6_500);

    assert.equal(engine.status, TIMER_STATUS.FINISHED);
    assert.equal(engine.remainingSeconds, 0);
    assert.equal(engine.getOvertimeSeconds(9_900), 3);
});
