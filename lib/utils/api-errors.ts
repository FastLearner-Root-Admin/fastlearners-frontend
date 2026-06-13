type ApiErrorValue = string | string[] | Record<string, unknown> | unknown[];

function formatErrorValue(value: ApiErrorValue): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join("\n");
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(
        ([key, nestedValue]) =>
          `${key}: ${formatErrorValue(nestedValue as ApiErrorValue)}`,
      )
      .join("\n");
  }

  return String(value);
}

export function formatApiErrorMessage(
  response:
    | {
        message?: unknown;
        errors?: Record<string, ApiErrorValue> | ApiErrorValue;
        error?: unknown;
      }
    | null
    | undefined,
  fallback = "Request failed",
) {
  if (!response) return fallback;

  const message =
    typeof response.message === "string" && response.message.trim()
      ? response.message.trim()
      : typeof response.error === "string" && response.error.trim()
        ? response.error.trim()
        : fallback;

  if (!response.errors) return message;

  const errorsText = Array.isArray(response.errors)
    ? formatErrorValue(response.errors)
    : Object.entries(response.errors)
        .map(
          ([field, value]) =>
            `${field}: ${formatErrorValue(value as ApiErrorValue)}`,
        )
        .filter(Boolean)
        .join("\n");

  if (!errorsText) return message;
  if (message.toLowerCase() === errorsText.toLowerCase()) return message;

  return `${message}\n${errorsText}`;
}
