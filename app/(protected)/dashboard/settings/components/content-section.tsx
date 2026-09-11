import React from "react";

type ContentSectionProps = {
  title: string;
  desc: string;
  children: React.ReactNode;
};

export function ContentSection({ title, desc, children }: ContentSectionProps) {
  return (
    <div className="min-w-0 space-y-6">
      <div className="min-w-0 space-y-1">
        <h2 className="break-words text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-balance text-sm text-muted-foreground">{desc}</p>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
