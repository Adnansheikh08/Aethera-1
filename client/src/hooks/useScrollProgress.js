import { useEffect, useRef, useState } from "react";

/**
 * Single rAF-throttled scroll dispatcher — the React port of
 * modules/scroll-dispatcher.js plus modules/motion.js.
 *
 * Multiple independent scroll listeners each performing layout reads is the
 * most common source of scroll jank. Subscribers receive one batched frame
 * containing pre-read metrics, so the layout is measured exactly once.
 */

const CONDENSE_THRESHOLD_PX = 80;

const subscribers = new Set();
let frameHandle = 0;

const readMetrics = () => {
    if (typeof window === "undefined") {
        return { scrollY: 0, viewportHeight: 0, progress: 0 };
    }

    const { scrollY, innerHeight } = window;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollableDistance = Math.max(documentHeight - innerHeight, 1);

    return {
        scrollY,
        viewportHeight: innerHeight,
        progress: Math.min(scrollY / scrollableDistance, 1),
    };
};

const flush = () => {
    frameHandle = 0;
    const metrics = readMetrics();
    subscribers.forEach((subscriber) => subscriber(metrics));
};

const schedule = () => {
    if (frameHandle === 0) {
        frameHandle = window.requestAnimationFrame(flush);
    }
};

/**
 * Registers a scroll subscriber and immediately primes it with current metrics
 * so first paint reflects a restored scroll position.
 *
 * Unlike the vanilla module, the window listeners and any pending frame are
 * torn down once the last subscriber leaves — a page-lifetime script could
 * afford to keep them, an unmounting component cannot.
 */
export const observeScroll = (subscriber) => {
    subscribers.add(subscriber);
    subscriber(readMetrics());

    if (subscribers.size === 1) {
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
    }

    return () => {
        subscribers.delete(subscriber);

        if (subscribers.size === 0) {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);

            if (frameHandle !== 0) {
                window.cancelAnimationFrame(frameHandle);
                frameHandle = 0;
            }
        }
    };
};

/**
 * Subscribes to the batched scroll frame without causing a re-render.
 *
 * The callback is held in a ref so a fresh inline function each render does not
 * churn the subscription; the latest one is always what gets invoked.
 */
export const useScrollDispatcher = (onFrame) => {
    const handlerRef = useRef(onFrame);

    useEffect(() => {
        handlerRef.current = onFrame;
    }, [onFrame]);

    useEffect(() => observeScroll((metrics) => handlerRef.current?.(metrics)), []);
};

/**
 * Top-edge rail reflecting document scroll completion.
 *
 * The transform is written straight to the node rather than routed through
 * state, because scroll progress changes every frame and a per-frame React
 * commit is exactly the jank the dispatcher exists to avoid.
 */
export const useScrollProgress = () => {
    const railRef = useRef(null);

    useScrollDispatcher(({ progress }) => {
        railRef.current?.style.setProperty("transform", `scaleX(${progress})`);
    });

    return railRef;
};

/**
 * Header gains an opaque backing once the hero starts scrolling away.
 *
 * A boolean flip is cheap to render and only changes twice per crossing, so
 * this one goes through state and lets the component own the class name.
 */
export const useHeaderCondensed = (thresholdPx = CONDENSE_THRESHOLD_PX) => {
    const [isCondensed, setIsCondensed] = useState(false);

    useScrollDispatcher(({ scrollY }) => {
        setIsCondensed(scrollY > thresholdPx);
    });

    return isCondensed;
};

/**
 * Numeric progress as state, for consumers that must render from the value
 * (a percentage label, an aria-valuenow). Prefer `useScrollProgress` for the
 * rail itself — this one commits on every scroll frame.
 */
export const useScrollProgressValue = () => {
    const [progress, setProgress] = useState(0);

    useScrollDispatcher((metrics) => setProgress(metrics.progress));

    return progress;
};

export default useScrollProgress;
