import { useEffect } from "react";

const LOCK_CLASS = "is-locked";

/**
 * Holds the page still while an overlay is open.
 *
 * `body.is-locked` (style.css) does the actual work with `overflow: hidden`.
 * body's overflow propagates to the viewport, so that single rule stops the
 * wheel, the arrow keys and touch drag together. What it also does is take the
 * classic scrollbar away, and losing those ~17px widens the body — the whole
 * page slides sideways the instant an overlay appears.
 *
 * So the gutter is measured and handed straight back as padding.
 * `window.innerWidth` counts the scrollbar and `documentElement.clientWidth`
 * does not, so the difference is exactly what the lock is about to reclaim. It
 * reads 0 where scrollbars are overlays (macOS, mobile) and where the page was
 * already locked by an outer overlay, and the padding is then skipped.
 *
 * Position-fixed chrome — the WhatsApp badge, the scroll progress bar — sits
 * outside the body's padding box and does move by that 17px. Compensating each
 * one means knowing every fixed element in the app; a jump in the page text is
 * the more visible of the two, so this trades the former for it.
 *
 * The previous inline value is captured rather than assumed empty so that
 * unmounting cannot wipe out a padding something else had set.
 */
export const useScrollLock = () => {
    useEffect(() => {
        const { body, documentElement } = document;
        const gutter = window.innerWidth - documentElement.clientWidth;
        const previousPadding = body.style.paddingInlineEnd;

        if (gutter > 0) {
            body.style.paddingInlineEnd = `${gutter}px`;
        }

        body.classList.add(LOCK_CLASS);

        return () => {
            body.classList.remove(LOCK_CLASS);
            body.style.paddingInlineEnd = previousPadding;
        };
    }, []);
};

export default useScrollLock;
