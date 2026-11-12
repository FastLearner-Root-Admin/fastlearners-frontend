"use client";

import React, { useCallback, useState } from "react";
import Image from "next/image";
import { ImageIcon, Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { StyledText } from "./StyledText";

interface LessonImageViewerProps {
  src: string;
  alt?: string;
  caption?: string | null;
  className?: string;
}

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export function LessonImageViewer({
  src,
  alt = "Illustration",
  caption,
  className,
}: LessonImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalZoom, setModalZoom] = useState(1);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setZoom((z) => (z > 1 ? 1 : 1.75));
  }, []);

  return (
    <>
      <figure
        className={cn(
          "mx-auto my-4 w-full max-w-xl rounded-xl border-2 border-border/70 bg-card/70 p-3 shadow-sm transition-all duration-200 dark:border-border/50 dark:bg-card/40 md:max-w-2xl",
          className,
        )}
      >
        {/* Controls Toolbar */}
        <div className="mb-2 flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ImageIcon className="size-3.5" />
            <span>Diagram / Figure</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="min-w-[42px] rounded bg-muted px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold text-foreground/80">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </Button>
            {zoom !== 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={resetZoom}
                title="Reset zoom"
                aria-label="Reset zoom"
              >
                <RotateCcw className="size-3" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setModalZoom(1);
                setModalOpen(true);
              }}
              title="View full screen"
              aria-label="View full screen"
            >
              <Maximize2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Bounded Image Container */}
        <div
          onDoubleClick={handleDoubleClick}
          className="relative flex max-h-[460px] min-h-[180px] items-center justify-center overflow-auto rounded-lg bg-neutral-100/70 p-2 dark:bg-neutral-950/60"
          title="Double-click to toggle zoom"
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.18s ease-out",
            }}
            className="flex items-center justify-center"
          >
            <Image
              src={src}
              alt={alt}
              width={800}
              height={450}
              className="size-auto max-h-[420px] max-w-full select-none rounded object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* Optional Caption */}
        {caption && (
          <figcaption className="my-2 text-center text-sm font-semibold italic text-foreground/85 dark:text-slate-200 sm:text-base">
            <StyledText text={caption} />
          </figcaption>
        )}
      </figure>

      {/* Expanded Modal Lightbox */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-4 sm:p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
            <DialogTitle className="text-base font-semibold">
              {caption || alt}
            </DialogTitle>
            <div className="mr-6 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() =>
                  setModalZoom((z) =>
                    Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)),
                  )
                }
                disabled={modalZoom <= MIN_ZOOM}
                title="Zoom out"
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <span className="min-w-[42px] rounded bg-muted px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold">
                {Math.round(modalZoom * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() =>
                  setModalZoom((z) => Math.min(3, +(z + ZOOM_STEP).toFixed(2)))
                }
                disabled={modalZoom >= 3}
                title="Zoom in"
              >
                <ZoomIn className="size-3.5" />
              </Button>
              {modalZoom !== 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setModalZoom(1)}
                  title="Reset zoom"
                >
                  <RotateCcw className="size-3" />
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex max-h-[72vh] items-center justify-center overflow-auto rounded-lg bg-neutral-900/10 p-2 dark:bg-neutral-950/80">
            <div
              style={{
                transform: `scale(${modalZoom})`,
                transformOrigin: "center center",
                transition: "transform 0.18s ease-out",
              }}
            >
              <Image
                src={src}
                alt={alt}
                width={1200}
                height={800}
                className="size-auto max-h-[68vh] max-w-full select-none rounded object-contain"
                unoptimized
              />
            </div>
          </div>
          {caption && (
            <p className="mt-2 text-center text-sm font-semibold italic text-foreground/85 dark:text-slate-200 sm:text-base">
              <StyledText text={caption} />
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
