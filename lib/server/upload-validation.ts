export const VALID_UPLOAD_MIME_TYPES = [
  "text/csv",
  "text/plain",
  "application/csv",
];

export const VALID_UPLOAD_EXTENSIONS = [".csv", ".txt"];

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function isValidUploadFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = VALID_UPLOAD_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  );
  const hasValidType = VALID_UPLOAD_MIME_TYPES.includes(file.type);
  return hasValidExtension || hasValidType;
}

/**
 * Automatically sanitizes CSV files that contain escaped quotes inside JSON fields.
 * In RFC 4180 CSV, quotes inside JSON strings are written as `\""`.
 * PHP's default `fgetcsv` escape behavior truncates the field when it encounters `\""`.
 * Replacing `\""` with `\u0022` safely preserves the JSON double quote for PHP's json_decode.
 */
export async function sanitizeUploadCSV(file: File): Promise<File> {
  const text = await file.text();
  if (text.includes('\\""')) {
    const sanitizedText = text.replace(/\\""/g, "\\u0022");
    return new File([sanitizedText], file.name, {
      type: file.type || "text/csv",
      lastModified: Date.now(),
    });
  }
  return file;
}
