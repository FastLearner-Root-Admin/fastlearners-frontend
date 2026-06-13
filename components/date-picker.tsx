import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DatePickerProps = {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DatePicker({
  selected,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
}: DatePickerProps) {
  const selectedValue = selected ? format(selected, "yyyy-MM-dd") : "";
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="relative w-full">
      <input
        type="date"
        value={selectedValue}
        min="1900-01-01"
        max={today}
        disabled={disabled}
        aria-label={placeholder}
        onChange={(event) => {
          const value = event.target.value;
          onSelect(value ? new Date(`${value}T00:00:00`) : undefined);
        }}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground",
        )}
      />
      <CalendarIcon
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50",
          disabled && "opacity-30",
        )}
      />
    </div>
  );
}
