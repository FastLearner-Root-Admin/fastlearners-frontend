// lib/utils/lesson-text-parser.ts
// Pure parser — no React imports, no side effects.

export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: "blue" | "dark-brown" | "red";
}

// Match earliest open tag: *b, *i, *bi, *tcb, *tcd, *tcr
const OPEN_TAG_RE = /\*(b|i|bi|tcb|tcd|tcr)(?=\s|[^a-z/]|$)/;

function tagToProps(tag: string): Partial<TextSegment> {
  switch (tag) {
    case "b":   return { bold: true };
    case "i":   return { italic: true };
    case "bi":  return { bold: true, italic: true };
    case "tcb": return { color: "blue" };
    case "tcd": return { color: "dark-brown" };
    case "tcr": return { color: "red" };
    default:    return {};
  }
}

function closeTagFor(openTag: string): string {
  if (openTag === "b") return "bo/";
  if (openTag === "i") return "i/";
  if (openTag === "bi") return "bi/";
  return "tc/"; // tcb, tcd, tcr all close with tc/
}

export function parseLessonText(raw: string): TextSegment[] {
  if (!raw) return [];
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

  parse(raw, {});
  return segments;
}

