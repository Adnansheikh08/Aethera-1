import { useEffect, useMemo, useState } from "react";

const TICK_INTERVAL_MS = 30_000;

/**
 * Per-timezone live clocks.
 *
 * Intl is treated as the formatting authority — no manual offset arithmetic,
 * which is what makes daylight-saving transitions correct for free.
 *
 * Formatters are cached across every clock on the page because constructing an
 * Intl.DateTimeFormat is comparatively expensive, and an unrecognised zone is
 * cached as `null` so it does not throw again on every tick.
 */
const formatters = new Map();

const formatterFor = (timeZone) => {
    if (!formatters.has(timeZone)) {
        try {
            formatters.set(timeZone, new Intl.DateTimeFormat([], {
                timeZone,
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }));
        } catch {
            formatters.set(timeZone, null);
        }
    }

    return formatters.get(timeZone);
};

/**
 * One interval drives every clock, matching the vanilla module's single
 * `setInterval`. Per-hook timers would start at different moments and let the
 * cards visibly disagree about the minute.
 */
const listeners = new Set();
let intervalHandle = 0;

const subscribeToTick = (listener) => {
    listeners.add(listener);

    if (listeners.size === 1) {
        intervalHandle = window.setInterval(() => {
            const now = new Date();
            listeners.forEach((notify) => notify(now));
        }, TICK_INTERVAL_MS);
    }

    return () => {
        listeners.delete(listener);

        if (listeners.size === 0 && intervalHandle !== 0) {
            window.clearInterval(intervalHandle);
            intervalHandle = 0;
        }
    };
};

/**
 * Live local time for one IANA zone.
 *
 * Returns { time, isLive }. The server-safe placeholder stays rendered until
 * the first client tick resolves, so the component should fall back to its own
 * "—" while `isLive` is false — the stylesheet fades the value in off
 * `.location-clock[data-clock].is-live`.
 *
 * An unrecognised zone yields `isLive: false` forever, leaving the placeholder
 * in place rather than showing a wrong time.
 */
export const useLocalClock = (timeZone = "UTC") => {
    const formatter = useMemo(() => formatterFor(timeZone), [timeZone]);
    const [time, setTime] = useState(null);

    useEffect(() => {
        if (!formatter) {
            setTime(null);
            return undefined;
        }

        // Prime immediately; hydration is the moment the placeholder is
        // allowed to be replaced.
        setTime(formatter.format(new Date()));

        return subscribeToTick((now) => setTime(formatter.format(now)));
    }, [formatter]);

    return {
        time,
        isLive: time !== null,
    };
};

export default useLocalClock;
