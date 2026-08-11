import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "./useReducedMotion.js";

const ALL_CATEGORIES = "all";
const EXIT_DURATION_MS = 350;

const sameIds = (a, b) => a.size === b.size && [...a].every((id) => b.has(id));

/**
 * Client-side portfolio filtering, ported from static/js/modules/portfolio-filter.js.
 *
 * The DOM version toggled `hidden` on cards after a timeout so the exit
 * animation stayed visible while assistive tech still saw an accurate tree.
 * That two-phase behaviour is preserved here as two pieces of state: cards
 * leave `visible` immediately (driving the .is-filtered-out class) and only
 * enter `hiddenSet` once the transition has resolved.
 *
 * Returns helpers the grid consumes per card, plus the live-region text.
 */
export function usePortfolioFilter(items, getCategory = (item) => item.category) {
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const reducedMotion = useReducedMotion();
  const timers = useRef(new Map());

  // Call sites write the accessor inline, so its identity changes on every
  // render. Keeping it in a ref keeps it out of the dependency arrays below;
  // as a direct dependency it rebuilt `matches` each render, which re-ran the
  // effect, whose setHiddenIds scheduled the next render without end.
  const accessor = useRef(getCategory);
  accessor.current = getCategory;

  const matches = useCallback(
    (item) => category === ALL_CATEGORIES || accessor.current(item) === category,
    [category],
  );

  useEffect(() => {
    const pending = timers.current;

    // Anything now matching becomes visible at once; anything filtered out is
    // marked hidden only after the exit transition would have finished.
    const nextHidden = new Set();
    for (const item of items) {
      const id = item.id ?? item.slug;
      window.clearTimeout(pending.get(id));
      pending.delete(id);

      if (matches(item)) continue;

      if (reducedMotion) {
        nextHidden.add(id);
        continue;
      }

      const timer = window.setTimeout(() => {
        setHiddenIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
        pending.delete(id);
      }, EXIT_DURATION_MS);
      pending.set(id, timer);
    }

    // A fresh Set is a new identity even when it holds the same ids, which
    // would re-render on every effect run. Keep the previous one when equal.
    setHiddenIds((prev) => (sameIds(prev, nextHidden) ? prev : nextHidden));

    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, [items, matches, reducedMotion]);

  const visibleCount = useMemo(() => items.filter(matches).length, [items, matches]);

  // A purely visual grid change is silent to screen-reader users, so the count
  // is announced through a live region exactly as the original did.
  const statusText = `${visibleCount} ${visibleCount === 1 ? "project" : "projects"} shown.`;

  return {
    category,
    setCategory,
    visibleCount,
    statusText,
    isEmpty: visibleCount === 0,
    /** Props for one card: the exit class and the deferred `hidden` attribute. */
    cardProps: (item) => {
      const id = item.id ?? item.slug;
      return {
        className: matches(item) ? "" : "is-filtered-out",
        hidden: hiddenIds.has(id),
      };
    },
    /** Props for one filter chip, including the pressed state. */
    chipProps: (value) => ({
      "aria-pressed": String(category === value),
      onClick: () => setCategory(value),
    }),
  };
}

export { ALL_CATEGORIES };
