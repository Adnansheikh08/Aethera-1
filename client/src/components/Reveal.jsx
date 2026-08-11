import { forwardRef } from "react";

import { useReveal } from "../hooks/useReveal.js";

/**
 * Wraps one scroll-revealed element.
 *
 * The stylesheet owns the transition via `.js-enabled [data-reveal].is-revealed`,
 * so the `data-reveal` attribute and the stagger custom property both have to
 * survive onto the rendered node — this component exists so every call site
 * gets that wiring right instead of repeating it.
 *
 * forwardRef because callers compose this with hooks that need the node too:
 * Comparison spreads useComparisonSlider's rootProps, ref included. Both refs
 * are assigned from one callback since a node can only carry one.
 */
export const Reveal = forwardRef(function Reveal(
  { as: Tag = "div", staggerIndex, className = "", style, children, ...rest },
  forwardedRef,
) {
  const { ref, isRevealed, style: revealStyle } = useReveal({ staggerIndex });

  const attachRef = (node) => {
    ref.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <Tag
      {...rest}
      ref={attachRef}
      data-reveal=""
      className={`${className}${isRevealed ? " is-revealed" : ""}`.trim()}
      // After the spread: a caller's style merges with the stagger delay
      // instead of replacing it, and neither one silently wins.
      style={{ ...revealStyle, ...style }}
    >
      {children}
    </Tag>
  );
});

export default Reveal;
