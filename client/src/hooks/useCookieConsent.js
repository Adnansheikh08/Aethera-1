import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const STORAGE_KEY = "aethera.consent.v1";
const ESSENTIAL_ONLY = { analytics: false, marketing: false };

const readStoredConsent = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw === null ? null : JSON.parse(raw);
    } catch {
        // Private-browsing modes and storage-partitioned contexts throw here.
        // Treating that as "no decision yet" keeps the banner functional.
        return null;
    }
};

const persistConsent = (consent) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
        // A failed write only means the banner reappears next visit, which is
        // the correct conservative outcome under GDPR/DPDP.
    }
};

/**
 * Granular cookie consent.
 *
 * Non-essential categories default to off and are only enabled by an explicit
 * affirmative action, which is what opt-in consent requires. Dismissing via
 * Escape stores essentials-only rather than silently accepting everything.
 *
 * `enabled` reproduces the composition root's ordering: the prompt waited for
 * the intro sequence so it was not competing for attention with the counter.
 * Pass the preloader's `isComplete` here.
 *
 * The stored decision is read during the first render, so a returning visitor
 * never sees a frame of the banner.
 */
export const useCookieConsent = ({ enabled = true, categories = ["analytics", "marketing"] } = {}) => {
    const [consent, setConsent] = useState(() => (
        typeof window === "undefined" ? null : readStoredConsent()
    ));

    // A decision already on record means the banner is never mounted at all.
    const [isMounted, setIsMounted] = useState(() => (
        typeof window === "undefined" ? false : readStoredConsent() === null
    ));
    const [isVisible, setIsVisible] = useState(false);
    const [selection, setSelection] = useState(() => (
        categories.reduce((accumulator, category) => ({ ...accumulator, [category]: false }), {})
    ));

    const bannerRef = useRef(null);
    const previouslyFocusedRef = useRef(null);
    // Read from the transitionend handler, which must not close over a stale
    // visibility value.
    const isVisibleRef = useRef(false);

    useEffect(() => {
        isVisibleRef.current = isVisible;
    }, [isVisible]);

    // Captured before the banner can take focus, so Escape returns the user to
    // wherever they actually were.
    useLayoutEffect(() => {
        if (isMounted && previouslyFocusedRef.current === null) {
            previouslyFocusedRef.current = document.activeElement;
        }
    }, [isMounted]);

    useEffect(() => {
        if (!enabled || !isMounted) {
            return undefined;
        }

        // Two frames: the banner must be painted in its hidden state before
        // `is-visible` lands, or the browser collapses both into one paint and
        // the entrance transition is skipped.
        let inner = 0;
        const outer = window.requestAnimationFrame(() => {
            inner = window.requestAnimationFrame(() => setIsVisible(true));
        });

        return () => {
            window.cancelAnimationFrame(outer);
            if (inner !== 0) {
                window.cancelAnimationFrame(inner);
            }
        };
    }, [enabled, isMounted]);

    const close = useCallback((decision) => {
        persistConsent(decision);
        setConsent(decision);
        setIsVisible(false);

        const previous = previouslyFocusedRef.current;
        if (previous instanceof HTMLElement) {
            previous.focus({ preventScroll: true });
        }
    }, []);

    const acceptSelected = useCallback(() => {
        // Spread over the essentials-only base so a category the markup no
        // longer offers can never be inferred as granted.
        close({ ...ESSENTIAL_ONLY, ...selection });
    }, [close, selection]);

    const acceptEssentialOnly = useCallback(() => close(ESSENTIAL_ONLY), [close]);

    const toggleCategory = useCallback((category, checked) => {
        setSelection((current) => ({ ...current, [category]: checked }));
    }, []);

    const handleKeyDown = useCallback((event) => {
        if (event.key === "Escape") {
            close(ESSENTIAL_ONLY);
        }
    }, [close]);

    // The node leaves the tree only once the exit transition has resolved,
    // mirroring the source's one-shot `transitionend` removal. Entrance
    // transitions land here too, hence the visibility check; the target check
    // keeps a child's own transition from tearing the banner down early.
    const handleTransitionEnd = useCallback((event) => {
        if (event.target === event.currentTarget && !isVisibleRef.current) {
            setIsMounted(false);
        }
    }, []);

    return {
        consent,
        isMounted,
        isVisible,
        selection,
        toggleCategory,
        acceptSelected,
        acceptEssentialOnly,
        /** Spread onto the `.cookie-banner` element. */
        bannerProps: {
            ref: bannerRef,
            onKeyDown: handleKeyDown,
            onTransitionEnd: handleTransitionEnd,
        },
        className: isVisible ? "cookie-banner is-visible" : "cookie-banner",
    };
};

export { ESSENTIAL_ONLY, STORAGE_KEY, readStoredConsent };
export default useCookieConsent;
