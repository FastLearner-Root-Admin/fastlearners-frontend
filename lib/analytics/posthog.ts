export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const DISTINCT_ID_KEY = "fastlearners_posthog_distinct_id";

function getDistinctId() {
  if (typeof window === "undefined") return undefined;

  const existing = window.localStorage.getItem(DISTINCT_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(DISTINCT_ID_KEY, generated);
  return generated;
}

export function identifyUser(
  userId: string | number | undefined,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(DISTINCT_ID_KEY, String(userId));
  trackEvent("$identify", {
    distinct_id: String(userId),
    $set: properties as any,
  });
}

export function resetAnalytics() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DISTINCT_ID_KEY);
}

export function trackEvent(
  event: string,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;

  const payload = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: getDistinctId(),
    properties: {
      ...properties,
      $current_url: window.location.href,
      $pathname: window.location.pathname,
    },
  };

  const body = JSON.stringify(payload);
  const url = `${POSTHOG_HOST.replace(/\/$/, "")}/capture/`;

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never break product flows.
  });
}
