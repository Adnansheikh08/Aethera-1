/**
 * Django applied |linebreaks, which wraps blank-line-separated blocks in <p>
 * and turns single newlines into <br>. Rendering as an array of paragraphs
 * reproduces that without dangerouslySetInnerHTML — the copy is admin-authored,
 * so injecting it as HTML would turn a CMS field into a stored-XSS vector.
 *
 * Shared by the detail pages and the service dialog, which show the same copy.
 */
export function Prose({ text }) {
  if (!text) return null;

  return (
    <>
      {String(text)
        .split(/\n\s*\n/)
        .map((block, index) => (
          <p key={index}>
            {block.split("\n").map((line, lineIndex, lines) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
    </>
  );
}
