import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "./useReducedMotion.js";

const COMPLETION_HOLD_MS = 260;
const SWEEP_DURATION_MS = 1400;
const PERCENT_MAX = 100;
const LOCK_CLASS = "is-locked";

/**
 * Percentage-counter intro screen.
 *
 * The counter is decorative, so it is skipped entirely under reduced-motion.
 * Scroll is locked via a body class rather than an inline style, keeping CSS
 * ownership in the stylesheet (`body.is-locked`).
 *
 * Where the vanilla module resolved a Promise that the composition root awaited
 * before starting the headline cascade and the consent prompt, this returns
 * `isComplete` — pass it as the `enabled` flag to `useHeadlineReveal` and
 * `useCookieConsent` to reproduce that ordering.
 *
 * Returns:
 *   percent     0-100 integer for the bar width
 *   label       the exact counter string, "42 %"
 *   isComplete  the intro has resolved; downstream sequences may start
 */
export const usePreloader = ({ onComplete } = {}) => {
    const reducedMotion = useReducedMotion();
    const [percent, setPercent] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const completeRef = useRef(onComplete);

    useEffect(() => {
        completeRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        let frame = 0;
        let holdTimer = 0;
        let startTimestamp = 0;
        let settled = false;

        const dismiss = () => {
            if (settled) {
                return;
            }

            settled = true;
            document.body.classList.remove(LOCK_CLASS);
            setIsComplete(true);
            completeRef.current?.();
        };

        if (reducedMotion) {
            dismiss();
            return undefined;
        }

        document.body.classList.add(LOCK_CLASS);

        const step = (timestamp) => {
            if (startTimestamp === 0) {
                startTimestamp = timestamp;
            }

            const elapsed = timestamp - startTimestamp;
            const ratio = Math.min(elapsed / SWEEP_DURATION_MS, 1);

            setPercent(Math.round(ratio * PERCENT_MAX));

            if (ratio < 1) {
                frame = window.requestAnimationFrame(step);
                return;
            }

            holdTimer = window.setTimeout(dismiss, COMPLETION_HOLD_MS);
        };

        frame = window.requestAnimationFrame(step);

        return () => {
            if (frame !== 0) {
                window.cancelAnimationFrame(frame);
            }
            if (holdTimer !== 0) {
                window.clearTimeout(holdTimer);
            }
            // Unmounting mid-sweep must never strand the page unscrollable.
            document.body.classList.remove(LOCK_CLASS);
        };
    }, [reducedMotion]);

    return {
        percent,
        label: `${percent} %`,
        isComplete,
        // `.preloader.is-complete` fades the overlay out; the element keeps its
        // permanent aria-hidden="true" from the markup, so nothing announces it.
        className: isComplete ? "preloader is-complete" : "preloader",
        barStyle: { width: `${percent}%` },
    };
};

export default usePreloader;
