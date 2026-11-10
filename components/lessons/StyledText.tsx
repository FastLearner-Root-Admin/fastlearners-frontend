"use client";

import React from "react";

import { cn } from "@/lib/utils";
import {
  parseLessonText,
  splitFigureCaption,
} from "@/lib/utils/lesson-text-parser";

interface StyledTextProps {
  text?: string | null;
  className?: string;
}

const COLOR_CLASSES: Record<string, string> = {
  blue: "text-blue-700 dark:text-blue-400",
  "dark-brown": "text-amber-800 dark:text-yellow-500",
  red: "text-red-700 dark:text-red-400",
};

export function StyledText({ text, className }: StyledTextProps) {
  if (!text) return null;
  const segments = parseLessonText(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        const cls = cn(
          seg.bold && seg.italic
            ? "font-bold italic"
            : seg.bold
              ? "font-bold"
              : seg.italic
                ? "italic"
                : undefined,
          seg.color ? COLOR_CLASSES[seg.color] : undefined,
        );
        if (!cls) return <React.Fragment key={i}>{seg.text}</React.Fragment>;
        return (
          <span key={i} className={cls}>
            {seg.text}
          </span>
        );
      })}
    </span>
  );
}

export function StyledReadText({ text, className }: StyledTextProps) {
  if (!text) return null;

  // If the text starts with "Read:", bold just those characters including colon
  if (/^Read:/i.test(text)) {
    const colonIdx = text.indexOf(":") + 1;
    const prefix = text.slice(0, colonIdx); // "Read:"
    const rest = text.slice(colonIdx); // " ..."
    return (
      <span className={className}>
        <strong className="font-bold">{prefix}</strong>
        <StyledText text={rest} />
      </span>
    );
  }

  return <StyledText text={text} className={className} />;
}

/**
 * Renders a concept description field.
 * If the text begins with an inline italic figure caption (*iFigure N: ...i/),
 * the caption is rendered on its own line (centered, small, italic) with the
 * body paragraph rendered separately beneath it — preventing the visual clash
 * where caption text runs flush into the following sentence.
 */
export function StyledDescriptionText({ text, className }: StyledTextProps) {
  if (!text) return null;
  const { caption, body } = splitFigureCaption(text);

  if (caption) {
    return (
      <>
        <p className="mb-2 text-center text-xs font-bold italic text-muted-foreground">
          <StyledText text={caption} />
        </p>
        {body.trim() && (
          <p
            className={cn(
              "text-base leading-relaxed text-foreground",
              className,
            )}
          >
            <StyledText text={body.trim()} />
          </p>
        )}
      </>
    );
  }

  return <StyledText text={text} className={className} />;
}
