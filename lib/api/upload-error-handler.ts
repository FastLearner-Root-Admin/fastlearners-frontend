import { AlertCircle, FileX, Server, Shield, XCircle } from "lucide-react";

export interface ParsedUploadError {
  code: number;
  message: string;
  category:
    | "validation"
    | "missing_reference"
    | "format"
    | "unauthorized"
    | "server";
  details?: {
    fieldErrors?: Record<string, string[]>;
    missingEntity?: string;
    missingColumn?: string;
    fileName?: string;
  };
  userMessage: string;
  suggestedAction?: string;
}

export function parseUploadError(
  response: Response,
  data: any,
): ParsedUploadError {
  const code = response.status;
  const message = data?.message || data?.error || "An unknown error occurred";

  let category: ParsedUploadError["category"] = "server";
  let userMessage = message;
  let suggestedAction: string | undefined;
  let details: ParsedUploadError["details"] = {};

  // Categorize based on status code and message patterns
  if (code === 401) {
    category = "unauthorized";
    userMessage =
      "Your session has expired or you are not authorized to perform this action.";
    suggestedAction = "Please log in again to continue.";
  } else if (code === 422) {
    category = "validation";

    // Check for missing files
    if (message.includes("required") || message.includes("missing file")) {
      userMessage = "Required files are missing or in an invalid format.";
      suggestedAction =
        "Please ensure all required files are selected and in CSV/TXT format.";
    } else if (data?.errors) {
      // Map data.errors (object or array) into details.fieldErrors
      if (Array.isArray(data.errors)) {
        // If errors is an array of strings, create a general error entry
        details.fieldErrors = { general: data.errors };
        userMessage = `Validation failed: ${data.errors.join(", ")}`;
        suggestedAction = "Please correct the validation errors and try again.";
      } else if (typeof data.errors === "object") {
        // If errors is an object with field-specific errors
        details.fieldErrors = {};
        const errorMessages: string[] = [];

        for (const [field, fieldErrors] of Object.entries(data.errors)) {
          if (Array.isArray(fieldErrors)) {
            details.fieldErrors[field] = fieldErrors;
            errorMessages.push(`${field}: ${fieldErrors.join(", ")}`);
          } else if (typeof fieldErrors === "string") {
            details.fieldErrors[field] = [fieldErrors];
            errorMessages.push(`${field}: ${fieldErrors}`);
          } else {
            details.fieldErrors[field] = [String(fieldErrors)];
            errorMessages.push(`${field}: ${String(fieldErrors)}`);
          }
        }

        userMessage =
          errorMessages.length > 0
            ? `Validation failed for: ${errorMessages.join("; ")}`
            : "Validation failed for one or more fields.";
        suggestedAction =
          "Please check the validation errors below and correct your CSV file.";
      } else {
        userMessage = `Validation failed: ${String(data.errors)}`;
        suggestedAction = "Please check your CSV file format and try again.";
      }
    } else if (data?.fieldErrors) {
      details.fieldErrors = data.fieldErrors;
      userMessage = "Validation failed for one or more fields.";
      suggestedAction =
        "Please check the validation errors below and correct your CSV file.";
    } else {
      userMessage = message;
      suggestedAction = "Please check your CSV file format and try again.";
    }
  } else if (code === 400) {
    // Check for missing column errors
    if (
      message.includes("missing") &&
      (message.includes("column") || message.includes("field"))
    ) {
      category = "format";

      // Extract missing column name from message
      const columnMatch =
        message.match(/column[s]?:?\s*['"]?(\w+)['"]?/i) ||
        message.match(/field[s]?:?\s*['"]?(\w+)['"]?/i);
      if (columnMatch) {
        details.missingColumn = columnMatch[1];
        userMessage = `The file is missing the required column: "${columnMatch[1]}".`;
        suggestedAction =
          "Please check the CSV template and ensure all required columns are present.";
      } else {
        userMessage = "The file is missing one or more required columns.";
        suggestedAction =
          "Please check the CSV template and ensure all required columns are present.";
      }
    }
    // Check for invalid JSON format
    else if (
      message.includes("JSON") ||
      message.includes("json") ||
      message.includes("parse")
    ) {
      category = "format";
      userMessage =
        "The CSV contains invalid JSON format in one or more fields.";
      suggestedAction =
        "Please ensure that JSON fields (objectives, description, solution_steps) are properly formatted.";
    }
    // Generic format error
    else {
      category = "format";
      userMessage = message;
      suggestedAction = "Please check that your CSV file format is correct.";
    }
  } else if (code === 404) {
    category = "missing_reference";

    // Extract entity type and name from message
    const entityMatch = message.match(
      /(Class|Subject|Term|Week|Lesson|Concept)\s+['"]?([^'"]+)['"]?\s+(?:not found|does not exist)/i,
    );
    if (entityMatch) {
      details.missingEntity = entityMatch[1];
      const entityName = entityMatch[2];
      userMessage = `The referenced ${entityMatch[1]} "${entityName}" was not found in the system.`;
      suggestedAction = `Please ensure the ${entityMatch[1]} exists in the system before uploading.`;
    } else {
      userMessage = "A referenced entity was not found in the system.";
      suggestedAction =
        "Please ensure all referenced entities (Class, Subject, Term, Week, Lesson, Concept) exist before uploading.";
    }
  } else if (code >= 500) {
    category = "server";
    userMessage =
      message || "An unexpected server error occurred while processing your upload.";
    suggestedAction =
      "Please try again later. If the problem persists, contact support.";
  }

  return {
    code,
    message,
    category,
    details,
    userMessage,
    suggestedAction,
  };
}

export function getCategoryIcon(category: ParsedUploadError["category"]) {
  switch (category) {
    case "validation":
      return AlertCircle;
    case "missing_reference":
      return FileX;
    case "format":
      return XCircle;
    case "unauthorized":
      return Shield;
    case "server":
      return Server;
    default:
      return AlertCircle;
  }
}

export function getErrorColor(category: ParsedUploadError["category"]): string {
  switch (category) {
    case "validation":
      return "text-yellow-600 dark:text-yellow-400";
    case "missing_reference":
      return "text-orange-600 dark:text-orange-400";
    case "format":
      return "text-red-600 dark:text-red-400";
    case "unauthorized":
      return "text-purple-600 dark:text-purple-400";
    case "server":
      return "text-gray-600 dark:text-gray-400";
    default:
      return "text-red-600 dark:text-red-400";
  }
}

export function getErrorBgColor(
  category: ParsedUploadError["category"],
): string {
  switch (category) {
    case "validation":
      return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
    case "missing_reference":
      return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800";
    case "format":
      return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
    case "unauthorized":
      return "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800";
    case "server":
      return "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800";
    default:
      return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
  }
}
