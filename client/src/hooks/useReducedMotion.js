import { useCallback, useSyncExternalStore } from "react";

/**
 * Environment capability probes — the React port of modules/environment.js.
 *
 * The queries live at module scope so every consumer shares one MediaQueryList,
 * but nothing caches a boolean at import time: a user can toggle OS-level
 * motion settings or dock a laptop to a touch display mid-session, and each
 * subscriber re-reads on change.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const FINE_POINTER_QUERY = "(pointer: fine)";
const HOVER_QUERY = "(hover: hover)";

const canMatchMedia = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

const queries = new Map();

const queryFor = (media) => {
    if (!canMatchMedia()) {
        return null;
    }

    if (!queries.has(media)) {
        queries.set(media, window.matchMedia(media));
    }

    return queries.get(media);
};

/** Imperative read, for use inside event handlers and rAF callbacks. */
export const prefersReducedMotion = () => queryFor(REDUCED_MOTION_QUERY)?.matches ?? false;

/** True only for precise, hover-capable input — excludes touch and stylus. */
export const supportsRichPointer = () => {
    const fine = queryFor(FINE_POINTER_QUERY);
    const hover = queryFor(HOVER_QUERY);

    return Boolean(fine?.matches && hover?.matches);
};

const useMediaQuery = (media) => {
    const subscribe = useCallback((onStoreChange) => {
        const query = queryFor(media);

        if (!query) {
            return () => {};
        }

        query.addEventListener("change", onStoreChange);
        return () => query.removeEventListener("change", onStoreChange);
    }, [media]);

    const getSnapshot = useCallback(() => queryFor(media)?.matches ?? false, [media]);
    // Server render assumes motion is allowed, matching the stylesheet default.
    const getServerSnapshot = useCallback(() => false, []);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

/**
 * The shared motion gate. Every animated hook in this directory reads it, so a
 * mid-session preference flip reaches all of them in the same commit.
 */
export const useReducedMotion = () => useMediaQuery(REDUCED_MOTION_QUERY);

/** Companion probe for pointer-driven effects such as the card tilt. */
export const useRichPointer = () => {
    const fine = useMediaQuery(FINE_POINTER_QUERY);
    const hover = useMediaQuery(HOVER_QUERY);

    return fine && hover;
};

export default useReducedMotion;
