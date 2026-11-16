// CSV Upload Helper with format detection and validation

export interface CSVValidationResult {
  isValid: boolean;
  format: "comma" | "pipe" | "unknown";
  headers: string[];
  missingColumns: string[];
  rowCount: number;
  errors: string[];
}

export interface CSVUploadOptions {
  file: File;
  requiredColumns: readonly string[];
  allowedFormats?: ("comma" | "pipe")[];
}

export interface CSVPreviewResult {
  format: "comma" | "pipe" | "unknown";
  headers: string[];
  sampleRows: string[][];
  totalRowCount: number;
  detectedDelimiter: string;
}

// Required columns for different file types (supporting new UUID-enabled structures)
export const LESSON_REQUIRED_COLUMNS = [
  "uuid",
  "class",
  "subject",
  "term",
  "week",
  "topic",
  "overview",
  "objectives",
  "key_concepts",
  "summary",
  "application",
  "order_index",
] as const;

export const CONCEPT_REQUIRED_COLUMNS = [
  "uuid",
  "lesson_uuid",
  "lesson",
  "title",
  "description",
  "order_index",
] as const;

export const EXAMPLE_REQUIRED_COLUMNS = [
  "uuid",
  "concept_uuid",
  "concept",
  "title",
  "problem",
  "solution_steps",
  "answer",
  "order_index",
] as const;

export const EXERCISE_REQUIRED_COLUMNS = [
  "uuid",
  "concept_uuid",
  "concept",
  "title",
  "problem",
  "solution_steps",
  "answers",
  "correct_answer",
  "order_index",
] as const;

export const GENERAL_EXERCISE_REQUIRED_COLUMNS = [
  "uuid",
  "lesson_uuid",
  "lesson",
  "problem",
  "solution_steps",
  "answers",
  "correct_answer",
  "order_index",
] as const;

export const CHECK_MARKER_REQUIRED_COLUMNS = [
  "uuid",
  "lesson_uuid",
  "lesson",
  "overview",
  "lesson_video",
  "concept_one",
  "concept_two",
  "concept_three",
  "concept_four",
  "concept_five",
  "concept_six",
  "concept_seven",
  "general_exercises",
] as const;

export const SCHEME_OF_WORK_REQUIRED_COLUMNS = [
  "subject",
  "class",
  "term",
  "week",
  "topic",
  "breakdown",
] as const;

export const CSV_COLUMNS = {
  lessons: LESSON_REQUIRED_COLUMNS,
  concepts: CONCEPT_REQUIRED_COLUMNS,
  examples: EXAMPLE_REQUIRED_COLUMNS,
  exercises: EXERCISE_REQUIRED_COLUMNS,
  general_exercises: GENERAL_EXERCISE_REQUIRED_COLUMNS,
  check_markers: CHECK_MARKER_REQUIRED_COLUMNS,
  scheme_of_work: SCHEME_OF_WORK_REQUIRED_COLUMNS,
} as const;

export type CSVColumnKey = keyof typeof CSV_COLUMNS;

// Columns that are optional for backward compatibility with older CSV exports
const OPTIONAL_COLUMNS = new Set([
  "uuid",
  "lesson_uuid",
  "concept_uuid",
  "order_index",
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Split raw CSV text into logical records (rows), correctly handling newlines
 * that appear inside double-quoted fields.
 *
 * Returns an array where index 0 is the header record and subsequent indices
 * are data records.  Each record is the raw text of that logical row (may
 * contain embedded \n characters when a field was quoted).
 */
function splitCSVRecords(content: string): string[] {
  const records: string[] = [];
  let current = "";
  let inQuotes = false;

  // Normalise CRLF → LF so we only have to handle one line-ending style.
  const text = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        // Escaped double-quote inside a quoted field — keep both chars raw so
        // parseCSVLine can decode them later.
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if (ch === "\n" && !inQuotes) {
      // Real record boundary — flush
      if (current.trim()) records.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) records.push(current);

  return records;
}

/**
 * Parse a single CSV record (one logical row) into individual field values.
 * Handles RFC 4180 double-quote escaping and strips surrounding quotes.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"'; // unescape ""  →  "
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
    i++;
  }

  result.push(current.trim());
  return result;
}

/** Strip leading BOM and optional "rowNumber|" prefix from a raw record. */
function cleanRecord(record: string): string {
  return record.replace(/^\uFEFF/, "").replace(/^\d+\|/, "");
}

/** Detect delimiter from the header record (after cleaning). */
function detectDelimiter(headerRecord: string): "comma" | "pipe" | "unknown" {
  const commas = (headerRecord.match(/,/g) ?? []).length;
  const pipes = (headerRecord.match(/\|/g) ?? []).length;
  if (pipes > commas && pipes > 0) return "pipe";
  if (commas > 0) return "comma";
  return "unknown";
}

/** Parse a header record into cleaned column names. */
function parseHeaders(
  record: string,
  format: "comma" | "pipe",
): string[] {
  const raw =
    format === "pipe"
      ? record.split("|").map((h) => h.trim())
      : parseCSVLine(record);
  return raw.map((h) => h.replace(/^["']|["']$/g, "").trim());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse CSV text and detect its format.
 * Correctly handles multi-line quoted fields (e.g. JSON in a description column).
 */
export function parseCSVContent(content: string): CSVValidationResult {
  const records = splitCSVRecords(content);

  if (records.length === 0) {
    return {
      isValid: false,
      format: "unknown",
      headers: [],
      missingColumns: [],
      rowCount: 0,
      errors: ["File is empty"],
    };
  }

  const headerRecord = cleanRecord(records[0]);
  const format = detectDelimiter(headerRecord);

  if (format === "unknown") {
    return {
      isValid: false,
      format: "unknown",
      headers: [],
      missingColumns: [],
      rowCount: 0,
      errors: ["Unable to detect CSV format (no commas or pipes found)"],
    };
  }

  const headers = parseHeaders(headerRecord, format);

  return {
    isValid: headers.length > 0,
    format,
    headers,
    missingColumns: [],
    rowCount: records.length - 1,
    errors: [],
  };
}

/**
 * Preview a CSV file — returns format, headers, sample rows, and total row count.
 * Safe for files with multi-line JSON fields.
 */
export async function previewCSVFile(
  file: File,
  maxSampleRows = 20,
): Promise<CSVPreviewResult> {
  const content = await file.text();
  const records = splitCSVRecords(content);

  if (records.length === 0) {
    return {
      format: "unknown",
      headers: [],
      sampleRows: [],
      totalRowCount: 0,
      detectedDelimiter: "",
    };
  }

  const headerRecord = cleanRecord(records[0]);
  const format = detectDelimiter(headerRecord);
  const delimiter = format === "pipe" ? "|" : ",";
  const headers = format !== "unknown" ? parseHeaders(headerRecord, format) : [];

  const dataRecords = records.slice(1);
  const sampleRows: string[][] = [];
  const count = Math.min(maxSampleRows, dataRecords.length);

  for (let i = 0; i < count; i++) {
    const record = cleanRecord(dataRecords[i]);
    const cells =
      format === "pipe"
        ? record.split("|").map((c) => c.trim())
        : format === "comma"
          ? parseCSVLine(record)
          : [record];

    sampleRows.push(cells.map((c) => c.replace(/^["']|["']$/g, "").trim()));
  }

  return {
    format,
    headers,
    sampleRows,
    totalRowCount: dataRecords.length,
    detectedDelimiter: delimiter,
  };
}

/**
 * Validate CSV against required columns.
 */
export function validateCSVColumns(
  csvResult: CSVValidationResult,
  requiredColumns: readonly string[],
): CSVValidationResult {
  const normalizedHeaders = csvResult.headers.map((h) => h.toLowerCase().trim());
  const missingColumns = requiredColumns.filter((col) => {
    const colLower = col.toLowerCase().trim();
    // Allow UUID and order_index to be omitted for backward compatibility with legacy files
    if (OPTIONAL_COLUMNS.has(colLower)) return false;
    return !normalizedHeaders.includes(colLower);
  });

  const errors = [...csvResult.errors];
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  return {
    ...csvResult,
    isValid: csvResult.isValid && missingColumns.length === 0 && errors.length === 0,
    missingColumns: [...missingColumns],
    errors,
  };
}

/**
 * Validate and prepare CSV file for upload.
 */
export async function validateCSVFile(
  options: CSVUploadOptions,
): Promise<CSVValidationResult> {
  try {
    const content = await options.file.text();
    const csvResult = parseCSVContent(content);
    const validationResult = validateCSVColumns(csvResult, options.requiredColumns);

    if (
      options.allowedFormats &&
      !options.allowedFormats.includes(validationResult.format as "comma" | "pipe")
    ) {
      validationResult.errors.push(
        `Format '${validationResult.format}' not allowed. Allowed formats: ${options.allowedFormats.join(", ")}`,
      );
      validationResult.isValid = false;
    }

    return validationResult;
  } catch (error) {
    return {
      isValid: false,
      format: "unknown",
      headers: [],
      missingColumns: [...options.requiredColumns],
      rowCount: 0,
      errors: [
        `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}

/**
 * Convert CSV content to a standardised delimiter format.
 * Uses record-aware splitting so multi-line quoted fields are preserved.
 */
export function normalizeCSVContent(
  content: string,
  targetFormat: "comma" | "pipe",
): string {
  const records = splitCSVRecords(content);
  if (records.length === 0) return content;

  const headerRecord = cleanRecord(records[0]);
  const sourceFormat = detectDelimiter(headerRecord);

  if (sourceFormat === "unknown") return content;

  return records
    .map((record) => {
      const clean = cleanRecord(record);

      // No conversion needed
      if (sourceFormat === targetFormat) return clean;

      const fields =
        sourceFormat === "comma"
          ? parseCSVLine(clean)
          : clean.split("|").map((f) => f.trim());

      if (targetFormat === "pipe") {
        return fields.join("|");
      }

      // → comma: re-quote fields that contain commas, quotes, or newlines
      return fields
        .map((field) => {
          if (field.includes(",") || field.includes('"') || field.includes("\n")) {
            return '"' + field.replace(/"/g, '""') + '"';
          }
          return field;
        })
        .join(",");
    })
    .join("\n");
}

/**
 * Create a standardised File object with normalised content.
 */
export function createNormalizedFile(
  originalFile: File,
  normalizedContent: string,
  targetFormat: "comma" | "pipe",
): File {
  const ext = originalFile.name.split(".").pop() ?? "csv";
  const basename = originalFile.name.replace(/\.[^/.]+$/, "");
  return new File([normalizedContent], `${basename}_${targetFormat}.${ext}`, {
    type: originalFile.type || "text/csv",
    lastModified: Date.now(),
  });
}

/**
 * Convert CSV content to the API's expected numbered-row format.
 * e.g. "1|header1,header2"  /  "2|value1,value2"
 *
 * Uses record-aware splitting so multi-line quoted fields are not broken.
 */
export function convertToAPIFormat(content: string): string {
  const records = splitCSVRecords(content);
  if (records.length === 0) return content;

  // Already in numbered format?
  if (/^\d+\|/.test(records[0])) return content;

  return records
    .map((record, idx) => {
      const line = idx === 0 && !record.startsWith("\uFEFF")
        ? "\uFEFF" + record
        : record;
      return `${idx + 1}|${line}`;
    })
    .join("\n");
}

/**
 * Create a File object with API-formatted content.
 */
export function createAPIFormattedFile(
  originalFile: File,
  content: string,
): File {
  const apiContent = convertToAPIFormat(content);
  const ext = originalFile.name.split(".").pop() ?? "csv";
  const basename = originalFile.name.replace(/\.[^/.]+$/, "");
  return new File([apiContent], `${basename}_api_format.${ext}`, {
    type: originalFile.type || "text/csv",
    lastModified: Date.now(),
  });
}
