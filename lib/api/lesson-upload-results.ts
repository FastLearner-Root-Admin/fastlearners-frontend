import type { ApiResponse } from "@/lib/api/lesson-service";

export type LessonUploadMode = "upload" | "update";

export interface LessonUploadResultItem {
  type: string;
  reason: string;
  fields: Record<string, string>;
}

export interface LessonUploadReport {
  title: string;
  mode: LessonUploadMode;
  message: string;
  processedCount: number;
  skippedCount: number;
  items: LessonUploadResultItem[];
  response: ApiResponse;
  createdAt: string;
}

const STORAGE_KEY = "fastlearners:last-lesson-upload-report";

const labelFromKey = (key: string) =>
  key
    .replace(/^skipped_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
};

const countFromContent = (
  content: Record<string, unknown>,
  mode: LessonUploadMode,
) => {
  const preferredKeys =
    mode === "update"
      ? ["update_count", "updated_count"]
      : ["upload_count", "uploaded_count"];

  for (const key of preferredKeys) {
    const value = content[key];
    if (typeof value === "number") return value;
  }

  return 0;
};

export const createLessonUploadReport = (
  response: ApiResponse,
  title: string,
  mode: LessonUploadMode,
): LessonUploadReport | null => {
  const content =
    response.content && typeof response.content === "object"
      ? (response.content as Record<string, unknown>)
      : {};

  const skippedEntries = Object.entries(content).filter(
    ([key, value]) => key.startsWith("skipped_") && Array.isArray(value),
  );

  const items = skippedEntries.flatMap(([key, value]) =>
    (value as Record<string, unknown>[]).map((item) => {
      const reason = stringifyValue(item.reason || item.error || item.message);
      const fields = Object.fromEntries(
        Object.entries(item)
          .filter(([field]) => !["reason", "error", "message"].includes(field))
          .map(([field, fieldValue]) => [field, stringifyValue(fieldValue)]),
      );

      return {
        type: labelFromKey(key),
        reason,
        fields,
      };
    }),
  );

  const explicitSkippedCount =
    typeof content.skipped_count === "number"
      ? content.skipped_count
      : typeof content.skipped_lessons_count === "number"
        ? content.skipped_lessons_count
        : items.length;

  const shouldReport =
    items.length > 0 || explicitSkippedCount > 0 || response.success === true;

  if (!shouldReport) return null;

  return {
    title,
    mode,
    message: response.message,
    processedCount: countFromContent(content, mode),
    skippedCount: explicitSkippedCount,
    items,
    response,
    createdAt: new Date().toISOString(),
  };
};

export const hasLessonUploadIssues = (report: LessonUploadReport | null) =>
  !!report && (report.skippedCount > 0 || report.items.length > 0);

export const saveLessonUploadReport = (report: LessonUploadReport) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(report));
};

export const readLessonUploadReport = (): LessonUploadReport | null => {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LessonUploadReport;
  } catch {
    return null;
  }
};

export const clearLessonUploadReport = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
};
