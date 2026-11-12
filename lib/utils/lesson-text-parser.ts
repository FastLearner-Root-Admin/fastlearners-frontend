// lib/utils/lesson-text-parser.ts
// Pure parser — no React imports, no side effects.

export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: "blue" | "dark-brown" | "red";
}

// Match earliest open tag: *bi, *tcb, *tcd, *tcr, *b, *i
// Longer alternatives MUST come first so "bi" wins over "b".
// No lookahead — tags may appear directly adjacent to word characters (e.g. *bbillionsbo/).
const OPEN_TAG_RE = /\*(bi|tcb|tcd|tcr|b|i)/;

function tagToProps(tag: string): Partial<TextSegment> {
  switch (tag) {
    case "b":
      return { bold: true };
    case "i":
      return { italic: true };
    case "bi":
      return { bold: true, italic: true };
    case "tcb":
      return { color: "blue" };
    case "tcd":
      return { color: "dark-brown" };
    case "tcr":
      return { color: "red" };
    default:
      return {};
  }
}

function closeTagFor(openTag: string): string {
  if (openTag === "b") return "bo/";
  if (openTag === "i") return "i/";
  if (openTag === "bi") return "bi/";
  return "tc/"; // tcb, tcd, tcr all close with tc/
}

/**
 * Normalizes all line breaks:
 * - Literal escaped "\\n" and "\\r\\n" from serialized JSON or databases
 * - Carriage returns "\\r\\n" and "\\r"
 * - Explicit "/n" markers (per lesson format specifications)
 */
export function normalizeLineBreaks(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\/n/g, "\n");
}

export function parseLessonText(raw: string): TextSegment[] {
  if (!raw) return [];
  const normalized = normalizeLineBreaks(raw);
  const segments: TextSegment[] = [];

  function parse(input: string, inherited: Partial<TextSegment>): void {
    if (!input) return;
    const match = OPEN_TAG_RE.exec(input);
    if (!match) {
      if (input) segments.push({ text: input, ...inherited });
      return;
    }
    const before = input.slice(0, match.index);
    if (before) segments.push({ text: before, ...inherited });

    const tag = match[1];
    const afterOpen = input.slice(match.index + match[0].length);
    const closeTag = closeTagFor(tag);
    const closeIdx = afterOpen.indexOf(closeTag);

    if (closeIdx === -1) {
      parse(afterOpen, { ...inherited, ...tagToProps(tag) });
      return;
    }
    parse(afterOpen.slice(0, closeIdx), { ...inherited, ...tagToProps(tag) });
    parse(afterOpen.slice(closeIdx + closeTag.length), inherited);
  }

  parse(normalized, {});
  return segments;
}

/**
 * If `raw` starts with an inline italic figure caption (*iFigure N: ...i/),
 * returns the caption text and the remaining body text separately.
 * Otherwise returns caption: null and body: raw.
 *
 * Example input: "*iFigure 3: 4 302 015 600i/ The H, T and O places..."
 * Returns: { caption: "Figure 3: 4 302 015 600", body: " The H, T and O places..." }
 */
export function splitFigureCaption(raw: string): {
  caption: string | null;
  body: string;
} {
  if (!raw) return { caption: null, body: raw };
  const normalized = normalizeLineBreaks(raw);
  // Match *iFigure <digits>: ... i/ at the very start of the string
  // Use non-greedy match ([\s\S]*?) so the caption can contain the letter 'i' without early termination
  const m = normalized.match(/^\*i(Figure\s+\d+:[\s\S]*?)i\//i);
  if (!m) return { caption: null, body: normalized };
  const caption = m[1].trim();
  const body = normalized.slice(m[0].length);
  return { caption, body };
}
