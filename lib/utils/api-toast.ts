import React from "react";
import { toast } from "sonner";

export type ApiResponseType = "success" | "error" | "info" | "warning";

function getToastContent(message: string): {
  message: string;
  description?: React.ReactNode;
} {
  const lines = message
    .split(/\n|;\s*/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return { message };

  return {
    message: "Please review these items",
    description: React.createElement(
      "ul",
      { className: "list-disc space-y-1 pl-4" },
      lines.map((line) => React.createElement("li", { key: line }, line)),
    ),
  };
}

export function showApiToast(type: ApiResponseType | undefined | null, message: string) {
  const content = getToastContent(message);

  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(content.message, { description: content.description });
      break;
    case "warning":
      toast.warning(content.message, { description: content.description });
      break;
    case "info":
    default:
      if (type) {
        toast.info(content.message, { description: content.description });
      } else {
        // If type is not provided at all, fallback to a neutral toast or info
        toast(content.message, { description: content.description });
      }
      break;
  }
}
