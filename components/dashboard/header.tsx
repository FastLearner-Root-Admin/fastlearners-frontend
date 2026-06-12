interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="grid min-w-0 gap-1">
        <h1 className="break-words font-heading text-xl font-semibold sm:text-2xl">
          {heading}
        </h1>
        {text && (
          <p className="break-words text-sm text-muted-foreground sm:text-base">
            {text}
          </p>
        )}
      </div>
      {children && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
