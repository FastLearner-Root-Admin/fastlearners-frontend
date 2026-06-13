import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { isValidDate } from "@/lib/utils/dates";

type DatePickerProps = {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
};

const months = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

function getDaysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function DatePicker({
  selected,
  onSelect,
  disabled = false,
}: DatePickerProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () =>
      Array.from(
        { length: currentYear - 1899 },
        (_, index) => currentYear - index,
      ),
    [currentYear],
  );

  const maxDays = getDaysInMonth(year, month);
  const days = useMemo(
    () => Array.from({ length: maxDays }, (_, index) => index + 1),
    [maxDays],
  );

  useEffect(() => {
    if (!isValidDate(selected)) {
      setDay("");
      setMonth("");
      setYear("");
      return;
    }

    setDay(pad(selected.getDate()));
    setMonth(pad(selected.getMonth() + 1));
    setYear(String(selected.getFullYear()));
  }, [selected]);

  const updateDate = (nextDay: string, nextMonth: string, nextYear: string) => {
    setDay(nextDay);
    setMonth(nextMonth);
    setYear(nextYear);

    if (!nextDay || !nextMonth || !nextYear) {
      onSelect(undefined);
      return;
    }

    const nextDate = new Date(
      Number(nextYear),
      Number(nextMonth) - 1,
      Number(nextDay),
    );
    const isExactDate =
      nextDate.getFullYear() === Number(nextYear) &&
      nextDate.getMonth() === Number(nextMonth) - 1 &&
      nextDate.getDate() === Number(nextDay);

    if (!isExactDate || nextDate > new Date()) {
      onSelect(undefined);
      return;
    }

    onSelect(nextDate);
  };

  const selectClassName = cn(
    "h-10 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    "invalid:text-muted-foreground",
  );

  return (
    <div className="grid w-full grid-cols-[0.85fr_1fr_1.05fr] gap-2">
      <select
        aria-label="Day"
        value={day}
        disabled={disabled}
        onChange={(event) => updateDate(event.target.value, month, year)}
        className={selectClassName}
      >
        <option value="">DD</option>
        {days.map((dayOption) => (
          <option key={dayOption} value={pad(dayOption)}>
            {pad(dayOption)}
          </option>
        ))}
      </select>

      <select
        aria-label="Month"
        value={month}
        disabled={disabled}
        onChange={(event) => {
          const nextMonth = event.target.value;
          const nextMaxDays = getDaysInMonth(year, nextMonth);
          const nextDay = day && Number(day) > nextMaxDays ? "" : day;
          updateDate(nextDay, nextMonth, year);
        }}
        className={selectClassName}
      >
        <option value="">MM</option>
        {months.map((monthOption) => (
          <option key={monthOption.value} value={monthOption.value}>
            {monthOption.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Year"
        value={year}
        disabled={disabled}
        onChange={(event) => {
          const nextYear = event.target.value;
          const nextMaxDays = getDaysInMonth(nextYear, month);
          const nextDay = day && Number(day) > nextMaxDays ? "" : day;
          updateDate(nextDay, month, nextYear);
        }}
        className={selectClassName}
      >
        <option value="">YYYY</option>
        {years.map((yearOption) => (
          <option key={yearOption} value={yearOption}>
            {yearOption}
          </option>
        ))}
      </select>
    </div>
  );
}
