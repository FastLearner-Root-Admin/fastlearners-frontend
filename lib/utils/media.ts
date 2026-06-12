/**
 * Utility to convert various YouTube URL formats to an embeddable URL.
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID (returns as-is)
 *
 * Returns null if the URL is not a recognized YouTube format or is empty.
 */
export function getYouTubeEmbedUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;

  // If it's already an embed URL, return as-is
  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  let videoId: string | null = null;

  // Match youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) {
    videoId = watchMatch[1];
  } else {
    // Match youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?#]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return null;
}

const DEFAULT_API_ORIGIN = "https://app.fastlearnersapp.com";

function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) return DEFAULT_API_ORIGIN;

  try {
    return new URL(apiUrl).origin;
  } catch {
    return DEFAULT_API_ORIGIN;
  }
}

export function resolveMediaUrl(path?: string | null) {
  const value = path?.trim();
  if (!value) return null;

  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return value;

  const normalizedPath = value.replace(/^\.\//, "");
  return `${getApiOrigin()}/${normalizedPath.replace(/^\/+/, "")}`;
}
