import React from "react";

type ContentSectionProps = {
  title: string;
  desc: string;
  children: React.ReactNode;
};

export function ContentSection({ title, desc, children }: ContentSectionProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-x-10 gap-y-4 py-6 sm:py-8 md:grid-cols-10">
      <div className="min-w-0 space-y-1.5 md:col-span-4">
        <h2 className="break-words text-lg font-semibold leading-snug">
          {title}
        </h2>
        <p className="text-balance text-sm text-muted-foreground">{desc}</p>
      </div>

      <div className="min-w-0 md:col-span-6">{children}</div>
    </div>
  );
}
