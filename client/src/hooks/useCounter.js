import { useEffect, useRef, useState } from "react";

import { observeOnce } from "./useReveal.js";
import { useReducedMotion } from "./useReducedMotion.js";

const COUNT_DURATION_MS = 1700;
const COUNT_THRESHOLD = 0.5;

const easeOutQuart = (ratio) => 1 - Math.pow(1 - ratio, 4);

/**
 * Counts the decimal places the value was *authored* with, from its string
 * form — not from the parsed number. "99.98" keeps two places and "140" keeps
 * none, exactly as `data-count-to` behaved. This is why the hook accepts the
 * raw authored string and does its own parse.
 */
const decimalsIn = (authored) => String(authored).split(".")[1]?.length ?? 0;

/**
 * Animates a numeric stat tile from zero to its authored value.
 *
 * The authored value is the input and the sole authority: the component renders
 * it as its initial text so the markup stays correct and crawlable without
 * scripting, and the hook only ever returns a *display string* for the digit
 * node — never the suffix, which the component keeps in its own element.
 *
 * Pass the value exactly as authored, ideally as a string ("99.98"), so the
 * decimal precision survives. Numbers work too, but `99.80` has already lost
 * its trailing zero before the hook can see it.
 *
 * Returns { ref, value, isComplete } — attach `ref` to the element that should
 * trigger the count when it scrolls into view, and render `value` in the digit
 * node.
 */
export const useCounter = (countTo, { durationMs = COUNT_DURATION_MS, threshold = COUNT_THRESHOLD } = {}) => {
    const reducedMotion = useReducedMotion();
    const nodeRef = useRef(null);

    const target = Number.parseFloat(countTo);
    const decimals = decimalsIn(countTo);
    const isCountable = Number.isFinite(target);
    // Reduced motion, or an unparseable value, means the authored figure stands
    // untouched — the source simply never observed those nodes.
    const authored = isCountable ? target.toFixed(decimals) : String(countTo ?? "");

    const [value, setValue] = useState(authored);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const node = nodeRef.current;
        const skip = !node
            || reducedMotion
            || !isCountable
            || typeof window === "undefined"
            || !("IntersectionObserver" in window);

        if (skip) {
            setValue(authored);
            setIsComplete(true);
            return undefined;
        }

        let frame = 0;
        let startTimestamp = 0;
        let cancelled = false;

        setIsComplete(false);

        const step = (timestamp) => {
            if (cancelled) {
                return;
            }

            if (startTimestamp === 0) {
                startTimestamp = timestamp;
            }

            const ratio = Math.min((timestamp - startTimestamp) / durationMs, 1);
            setValue((easeOutQuart(ratio) * target).toFixed(decimals));

            if (ratio < 1) {
                frame = window.requestAnimationFrame(step);
                return;
            }

            // Land on the exact authored figure rather than the eased
            // approximation of it.
            setValue(target.toFixed(decimals));
            setIsComplete(true);
        };

        const unobserve = observeOnce(node, threshold, "0px", () => {
            // Zero is written only once the tile has actually intersected. The
            // authored figure stays on screen until then — a tile scrolled past
            // quickly, or one that never reaches the threshold, must never be
            // caught displaying 0.
            setValue((0).toFixed(decimals));
            frame = window.requestAnimationFrame(step);
        });

        return () => {
            cancelled = true;
            unobserve();

            if (frame !== 0) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [reducedMotion, isCountable, authored, target, decimals, durationMs, threshold]);

    return { ref: nodeRef, value, isComplete };
};

export default useCounter;
