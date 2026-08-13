import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const MOBILE_BREAKPOINT = "(max-width: 48rem)";

/**
 * Disclosure-pattern mobile navigation, ported from static/js/modules/navigation.js.
 *
 * The source toggled a `data-collapsed` attribute directly; here the open state
 * is React state and the attribute is derived in the JSX. The behaviour that
 * mattered is preserved: the panel is only collapsible while the mobile media
 * query matches, so resizing past the breakpoint can never strand the links in
 * a hidden state, and Escape / outside-click both close it.
 *
 * Returns { isOpen, isMobile, toggle, close, toggleRef, panelRef }.
 */
export function useNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BREAKPOINT).matches,
  );
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_BREAKPOINT);

    const sync = () => {
      setIsMobile(query.matches);
      // Leaving mobile must not leave a stale collapsed panel behind.
      if (!query.matches) setIsOpen(false);
    };

    query.addEventListener("change", sync);
    sync();
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };

    const onPointerDown = (event) => {
      const target = event.target;
      const outside =
        target instanceof Node &&
        !panelRef.current?.contains(target) &&
        !toggleRef.current?.contains(target);
      if (outside) setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  // Clicking a link inside the panel closes it, but only on mobile — on desktop
  // the panel is always visible and closing it would be meaningless.
  const close = useCallback(() => {
    if (isMobile) setIsOpen(false);
  }, [isMobile]);

  return { isOpen, isMobile, toggle, close, toggleRef, panelRef };
}

/**
 * Marks the nav link whose section currently occupies the viewport, ported from
 * initSectionSpy. `aria-current` carries the state to assistive tech and the
 * underline is a stylesheet reaction to that attribute, so there is no
 * visual-only class that can drift out of sync.
 *
 * Takes the section ids to watch and returns the currently active one.
 */
export function useSectionSpy(sectionIds) {
  const [activeId, setActiveId] = useState(null);
  const key = sectionIds.join("|");

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section) => section !== null);

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return activeId;
}

/**
 * Puts every client-side navigation at the top of the incoming page.
 *
 * Django served a fresh document per link, so the browser always started at the
 * top. The router only swaps <main>, which leaves the outgoing page's scroll
 * offset in place — clicking Home from halfway down a case study used to drop
 * you halfway down the landing page.
 *
 * Instant rather than smooth: the `scroll-behavior: smooth` on html would
 * animate the whole outgoing offset away *after* the new route has painted,
 * so you would watch an unrelated page scroll past.
 */
export function useScrollTopOnNavigate() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    // First mount is the browser's business: it restores the scroll position on
    // reload and resolves the fragment on a deep link. Only react to a move.
    if (pathname === previousPath.current) return;
    previousPath.current = pathname;

    // A fragment names its own destination; only a bare path means "the top".
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
}
