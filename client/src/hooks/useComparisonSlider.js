import { useCallback, useRef, useState } from "react";

/**
 * Before/after comparison slider, ported from static/js/modules/comparison-slider.js.
 *
 * The native `input[type=range]` stays the single source of truth — it ships
 * keyboard support, arrow-key stepping and correct screen-reader semantics for
 * free. Pointer dragging writes back into that same value, so mouse and
 * keyboard can never disagree about the current position.
 *
 * Returns { value, rootProps, rangeProps }.
 */
export function useComparisonSlider(initialValue = 50) {
  const [value, setValue] = useState(initialValue);
  const rootRef = useRef(null);

  const seekTo = useCallback((clientX) => {
    const root = rootRef.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    const ratio = (clientX - bounds.left) / bounds.width;
    setValue(Math.min(Math.max(ratio * 100, 0), 100));
  }, []);

  return {
    value,
    rootProps: {
      ref: rootRef,
      // The divider is a styled sibling driven by this custom property.
      style: { "--compare-position": `${value}%` },
      onPointerDown: (event) => {
        // Ignore the range itself; it already handles its own dragging.
        if (event.target instanceof HTMLInputElement) return;
        rootRef.current?.setPointerCapture(event.pointerId);
        seekTo(event.clientX);
      },
      onPointerMove: (event) => {
        if (rootRef.current?.hasPointerCapture(event.pointerId)) seekTo(event.clientX);
      },
      onPointerUp: (event) => {
        if (rootRef.current?.hasPointerCapture(event.pointerId)) {
          rootRef.current.releasePointerCapture(event.pointerId);
        }
      },
    },
    rangeProps: {
      type: "range",
      min: 0,
      max: 100,
      value,
      "aria-valuetext": `${Math.round(value)} percent edited`,
      onChange: (event) => setValue(Number(event.target.value)),
    },
  };
}
