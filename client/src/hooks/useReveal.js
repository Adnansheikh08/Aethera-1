import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useReducedMotion } from "./useReducedMotion.js";

const STAGGER_STEP_MS = 85;
const STAGGER_CAP_MS = 340;
const REVEAL_THRESHOLD = 0.08;
const REVEAL_ROOT_MARGIN = "0px 0px -60px 0px";

const supportsObserver = () => typeof window !== "undefined" && "IntersectionObserver" in window;

/**
 * One IntersectionObserver per (threshold, rootMargin) pair, shared by every
 * element that asks for it — the vanilla module used a single observer for the
 * whole page, and one-observer-per-element would multiply the browser's
 * intersection bookkeeping across a long grid.
 */
const pools = new Map();

const poolFor = (threshold, rootMargin) => {
    const key = `${threshold}|${rootMargin}`;
    let pool = pools.get(key);

    if (!pool) {
        const callbacks = new Map();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const reveal = callbacks.get(entry.target);
                // Revealed elements are dropped so the observer drains to empty
                // as the user scrolls instead of holding every node.
                observer.unobserve(entry.target);
                callbacks.delete(entry.target);
                reveal?.();
            });
        }, { threshold, rootMargin });

        pool = { observer, callbacks };
        pools.set(key, pool);
    }

    return pool;
};

/**
 * Observes a node until it first intersects, then drops it. Shared with
 * useCounter so both features run off the same pooled observers.
 */
export const observeOnce = (node, threshold, rootMargin, onReveal) => {
    const { observer, callbacks } = poolFor(threshold, rootMargin);

    callbacks.set(node, onReveal);
    observer.observe(node);

    return () => {
        callbacks.delete(node);
        observer.unobserve(node);
    };
};

/**
 * Scroll-triggered reveal for a single element.
 *
 * Returns the ref to attach, the revealed flag, and the inline custom property
 * carrying this element's stagger offset. The stylesheet still owns the
 * transition — `.js-enabled [data-reveal].is-revealed` — so the element must
 * keep its `data-reveal` attribute and apply `is-revealed` from `isRevealed`.
 *
 * Stagger is scoped to the nearest `[data-reveal-group]` so each section
 * restarts its cascade, and capped so late items in a long grid never stall.
 * Pass `staggerIndex` when the component already knows its position in the
 * group and would rather not have the DOM consulted.
 */
export const useReveal = (options = {}) => {
    const {
        threshold = REVEAL_THRESHOLD,
        rootMargin = REVEAL_ROOT_MARGIN,
        staggerIndex,
    } = options;

    const reducedMotion = useReducedMotion();
    const nodeRef = useRef(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [delayMs, setDelayMs] = useState(0);

    // Layout effect so the delay lands in the same paint as the mounted node,
    // before the observer can possibly fire.
    useLayoutEffect(() => {
        const node = nodeRef.current;

        if (!node || reducedMotion) {
            return undefined;
        }

        const index = Number.isInteger(staggerIndex)
            ? staggerIndex
            : (() => {
                const group = node.closest("[data-reveal-group]") ?? document.body;
                return Array.from(group.querySelectorAll("[data-reveal]")).indexOf(node);
            })();

        setDelayMs(Math.min(Math.max(index, 0) * STAGGER_STEP_MS, STAGGER_CAP_MS));
        return undefined;
    }, [reducedMotion, staggerIndex]);

    useEffect(() => {
        const node = nodeRef.current;

        if (!node) {
            return undefined;
        }

        // Reduced motion shows everything at once, with no observer at all.
        if (reducedMotion || !supportsObserver()) {
            setIsRevealed(true);
            return undefined;
        }

        return observeOnce(node, threshold, rootMargin, () => setIsRevealed(true));
    }, [reducedMotion, threshold, rootMargin]);

    return {
        ref: nodeRef,
        isRevealed,
        // Consumers spread this onto the element: style={revealStyle}.
        style: reducedMotion ? undefined : { "--reveal-delay": `${delayMs}ms` },
        delayMs,
    };
};

/**
 * Splits a string into words while preserving the whitespace runs between
 * them, so a headline can be rendered as per-word spans without collapsing its
 * spacing. Whitespace chunks come back with `isWord: false` and must be
 * rendered as plain text — only real words carry a `--word-index`.
 */
export const splitWords = (text) => {
    let wordIndex = 0;

    return text
        .split(/(\s+)/)
        .filter((chunk) => chunk.length > 0)
        .map((chunk) => {
            const isWord = chunk.trim().length > 0;
            return {
                chunk,
                isWord,
                wordIndex: isWord ? wordIndex++ : null,
            };
        });
};

/**
 * Timing gate for the headline word cascade.
 *
 * The vanilla module rewrote the DOM to wrap words; in React the component
 * renders `.reveal-word` spans itself (see `splitWords`) and this hook only
 * owns when `is-revealed` lands. Under reduced motion it is immediate, exactly
 * as the source short-circuited before any wrapping.
 *
 * `enabled` exists because the composition root deferred the cascade until the
 * intro sequence resolved.
 */
export const useHeadlineReveal = (delayMs = 0, { enabled = true } = {}) => {
    const reducedMotion = useReducedMotion();
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        if (reducedMotion) {
            setIsRevealed(true);
            return undefined;
        }

        const timer = window.setTimeout(() => setIsRevealed(true), delayMs);
        return () => window.clearTimeout(timer);
    }, [enabled, reducedMotion, delayMs]);

    return isRevealed;
};

export default useReveal;
