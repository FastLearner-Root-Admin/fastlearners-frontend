import { isValid, parse } from "date-fns";

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && isValid(value);
}

export function parseProfileDate(value?: string | null): Date | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  for (const dateFormat of ["dd/MM/yyyy", "yyyy-MM-dd"]) {
    const parsed = parse(trimmed, dateFormat, new Date());
    if (isValidDate(parsed)) return parsed;
  }

  const fallback = new Date(trimmed);
  return isValidDate(fallback) ? fallback : undefined;
}
