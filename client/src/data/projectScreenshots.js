/**
 * Homepage screenshots for the portfolio cards, keyed by filename.
 *
 * A project with a screenshot needs no code change anywhere: drop
 * client/src/assets/projects/<slug>.png in place and the matching card picks it
 * up. The filename *is* the mapping, so there is no separate table to drift out
 * of sync with the files on disk, and a capture filed under the wrong name shows
 * up as a wrong filename rather than silently appearing on another project's
 * card. A slug with no file simply has no entry.
 *
 * `eager: true` resolves each image through Vite at build time and returns its
 * final fingerprinted URL — the same guarantee the explicit imports in
 * serviceBackgrounds.js give (a bare "/assets/..." string would resolve at
 * runtime and 404 in the production build), minus two lines per service. An
 * empty directory yields an empty map rather than a build error.
 *
 * The slug must match what the API returns for the item — that is what
 * PortfolioCard looks up. A name that matches nothing falls back to the card's
 * placeholder.
 */
const modules = import.meta.glob("../assets/projects/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const PROJECT_SCREENSHOTS = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    // "…/projects/animal-super-store.png" -> "animal-super-store"
    path.slice(path.lastIndexOf("/") + 1).replace(/\.[^.]+$/, ""),
    url,
  ]),
);

export const projectScreenshot = (slug) => PROJECT_SCREENSHOTS[slug] ?? null;

/**
 * Captures that must be shown whole instead of cropped to fill the card.
 *
 * `.portfolio-media.has-screenshot` is a fixed 16/10 box, and `cover` fills it
 * by scaling whichever axis overflows — so a capture wider than 16/10, which is
 * what a full-width hero shot is, loses its left and right edges. Those edges
 * are where a site keeps its logo and its header call to action: the two things
 * that say which site you are looking at. These slugs render with `contain`
 * instead, so the whole capture survives, at the cost of a band the card paints
 * the colour of the capture's own paper.
 *
 * The box itself does not change, so the card still lines up with the ones
 * beside it. Which image a slug gets is still decided by the filename above;
 * only the fitting is decided here, because no filename can carry it.
 *
 * Listing a slug here whose capture is *not* wider than 16/10 is harmless but
 * pointless — it can only gain a band it did not need. Leaving a wide capture
 * off the list is the silent failure: it just crops.
 */
const UNCROPPED_SLUGS = new Set(["abcipl-interiors", "yara-school"]);

export const projectScreenshotUncropped = (slug) => UNCROPPED_SLUGS.has(slug);

export default PROJECT_SCREENSHOTS;
