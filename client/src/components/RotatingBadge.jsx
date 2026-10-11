import { useEffect, useState } from "react";

/**
 * The service line in the hero badge.
 *
 * Authored here rather than borrowed from sections.jsx's CAPABILITIES: that
 * list is the marquee's fallback copy and its last entry reads "and" where
 * this one reads "&", so the two are kept apart on purpose.
 */
const SERVICES = [
  "Web Development",
  "Mobile App Development",
  "Digital Advertising & Campaigns",
  "Video & Photo Editing",
  "High-CTR Thumbnail Design",
  "On-Location Blog & Vlog Shoots",
  "UI/UX Design",
  "Software Testing",
  "Odoo Implementation & Development",
  "SEO",
];

const ROTATE_INTERVAL_MS = 2200;

/**
 * Rotating service badge for the hero.
 *
 * Renders inside the existing `.badge-pill` element rather than rebuilding it,
 * so the status dot (a `::before` on that class), border, background, padding
 * and type all stay exactly as the stylesheet already draws them — this
 * component only owns the text and its swap.
 *
 * The span is keyed by index so React remounts it on every change. That remount
 * is what restarts the CSS fade; without it the animation would run once on
 * mount and every later swap would cut with no transition at all.
 */
export function RotatingBadge() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % SERVICES.length),
      ROTATE_INTERVAL_MS,
    );

    return () => window.clearInterval(timer);
  }, []);

  return (
    <p className="badge-pill">
      <span key={index} className="badge-pill-rotating">
        {SERVICES[index]}
      </span>
    </p>
  );
}

export default RotatingBadge;
