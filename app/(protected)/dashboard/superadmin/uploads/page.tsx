"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Download,
  Eye,
  FileUp,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  ApiResponse,
  CSV_COLUMNS,
  uploadAllLessonFiles,
  uploadCheckMarkersFileWithValidation,
  uploadConceptsFileWithValidation,
  uploadExamplesFileWithValidation,
  uploadExercisesFileWithValidation,
  uploadGeneralExercisesFileWithValidation,
  uploadLessonsFileWithValidation,
  UploadResult,
  uploadSchemeOfWorkFileWithValidation,
  updateCheckMarkersFileWithValidation,
  updateConceptsFileWithValidation,
  updateExamplesFileWithValidation,
  updateExercisesFileWithValidation,
  updateGeneralExercisesFileWithValidation,
  updateLessonsFileWithValidation,
} from "@/lib/api/lesson-service";
import {
  createLessonUploadReport,
  hasLessonUploadIssues,
  saveLessonUploadReport,
  type LessonUploadMode,
} from "@/lib/api/lesson-upload-results";
import {
  parseUploadError,
  type ParsedUploadError,
} from "@/lib/api/upload-error-handler";
import {
  previewCSVFile,
  validateCSVFile,
  type CSVPreviewResult,
} from "@/lib/utils/csv-upload-helper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FileUpload from "@/components/lessons/file-upload";
import {
  UploadType,
  useSuperadminState,
} from "@/components/superadmin/use-superadmin-state";
import { UploadErrorDisplay } from "@/components/upload/UploadErrorDisplay";

type BulkFileKey =
  | "lessons_file"
  | "concepts_file"
  | "examples_file"
  | "exercises_file"
  | "general_exercises_file"
  | "check_markers_file";

interface BulkPreviewState {
  [key: string]: CSVPreviewResult | null;
}

const BULK_FILE_CONFIGS: {
  id: BulkFileKey;
  label: string;
  requiredColumns: string[];
}[] = [
  {
    id: "lessons_file",
    label: "Lessons File",
    requiredColumns: CSV_COLUMNS.lessons,
  },
  {
    id: "concepts_file",
    label: "Concepts File",
    requiredColumns: CSV_COLUMNS.concepts,
  },
  {
    id: "examples_file",
    label: "Examples File",
    requiredColumns: CSV_COLUMNS.examples,
  },
  {
    id: "exercises_file",
    label: "Exercises File",
    requiredColumns: CSV_COLUMNS.exercises,
  },
  {
    id: "general_exercises_file",
    label: "General Exercises File",
    requiredColumns: CSV_COLUMNS.general_exercises,
  },
  {
    id: "check_markers_file",
    label: "Check Markers File",
    requiredColumns: CSV_COLUMNS.check_markers,
  },
];

const UPLOAD_CONFIG: {
  id: UploadType;
  title: string;
  description: string;
  uploadFn: (file: File) => Promise<UploadResult>;
  updateFn?: (file: File) => Promise<UploadResult>;
}[] = [
  {
    id: "lessons",
    title: "Lessons",
    description: "Upload main lessons data (topics, overviews, objectives)",
    uploadFn: uploadLessonsFileWithValidation,
    updateFn: updateLessonsFileWithValidation,
  },
  {
    id: "concepts",
    title: "Concepts",
    description: "Upload lesson concepts and explanations",
    uploadFn: uploadConceptsFileWithValidation,
    updateFn: updateConceptsFileWithValidation,
  },
  {
    id: "examples",
    title: "Examples",
    description: "Upload worked examples for concepts",
    uploadFn: uploadExamplesFileWithValidation,
    updateFn: updateExamplesFileWithValidation,
  },
  {
    id: "exercises",
    title: "Exercises",
    description: "Upload practice exercises for concepts",
    uploadFn: uploadExercisesFileWithValidation,
    updateFn: updateExercisesFileWithValidation,
  },
  {
    id: "general_exercises",
    title: "General Exercises",
    description: "Upload lesson-level general exercises",
    uploadFn: uploadGeneralExercisesFileWithValidation,
    updateFn: updateGeneralExercisesFileWithValidation,
  },
  {
    id: "check_markers",
    title: "Check Markers",
    description: "Upload progress check markers",
    uploadFn: uploadCheckMarkersFileWithValidation,
    updateFn: updateCheckMarkersFileWithValidation,
  },
  {
    id: "scheme_of_work",
    title: "Scheme of Work",
    description: "Upload curriculum scheme of work",
    uploadFn: uploadSchemeOfWorkFileWithValidation,
  },
];

export default function UploadsPage() {
  const router = useRouter();
  const {
    uploadStates,
    setUploadState,
    resetUploadState,
    bulkFiles,
    setBulkFile,
    isBulkUploading,
    bulkProgress,
    bulkError,
    bulkSuccess,
    setBulkStatus,
    resetBulkState,
  } = useSuperadminState();

  const [bulkPreviews, setBulkPreviews] = useState<BulkPreviewState>({});
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [bulkParsedError, setBulkParsedError] =
    useState<ParsedUploadError | null>(null);
  const [uploadMode, setUploadMode] = useState<LessonUploadMode>("upload");

  // --- Individual Upload Handlers ---

  const handleFileSelect = (type: UploadType, file: File) => {
    setUploadState(type, {
      selectedFile: file,
      error: null,
      success: false,
      parsedError: undefined,
    });
  };

  const handleFileRemove = (type: UploadType) => {
    resetUploadState(type);
  };

  const handleUpload = async (type: UploadType) => {
    const state = uploadStates[type];
    if (!state.selectedFile) return;

    setUploadState(type, {
      isUploading: true,
      uploadProgress: 0,
      error: null,
      parsedError: undefined,
    });

    // Simulate progress using functional update to avoid stale closure
    const progressInterval = setInterval(() => {
      setUploadState(type, (prev) => ({
        uploadProgress:
          prev.uploadProgress >= 90 ? 90 : prev.uploadProgress + 10,
      }));
    }, 200);

    try {
      const config = UPLOAD_CONFIG.find((c) => c.id === type);
      if (!config) throw new Error("Invalid upload type");

      const activeUploadFn =
        uploadMode === "update" && config.updateFn
          ? config.updateFn
          : config.uploadFn;
      const result = await activeUploadFn(state.selectedFile);

      clearInterval(progressInterval);

      if (result.success) {
        const report = result.apiResponse
          ? createLessonUploadReport(
              result.apiResponse,
              config.title,
              uploadMode,
            )
          : null;

        if (report) {
          saveLessonUploadReport(report);
        }

        setUploadState(type, {
          isUploading: false,
          uploadProgress: 100,
          success: true,
          parsedError: undefined,
        });
        if (hasLessonUploadIssues(report)) {
          toast.warning(`${config.title} completed with skipped rows`, {
            description: "Review the upload result for correction details.",
          });
          router.push("/dashboard/superadmin/uploads/results");
        } else {
          toast.success(
            `${config.title} ${
              uploadMode === "update" ? "updated" : "uploaded"
            } successfully`,
          );
        }
      } else {
        // Upload failed - use parsed error if available
        const errorMessage =
          result.parsedError?.userMessage || result.error || "Upload failed";
        setUploadState(type, {
          isUploading: false,
          uploadProgress: 0,
          error: errorMessage,
          parsedError: result.parsedError,
        });
        toast.error(
          `Failed to ${uploadMode === "update" ? "update" : "upload"} ${
            config.title
          }`,
          {
            description: errorMessage,
          },
        );
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      const errorMessage = error.message || "An unexpected error occurred";
      setUploadState(type, {
        isUploading: false,
        uploadProgress: 0,
        error: errorMessage,
        parsedError: undefined,
      });
      toast.error(`Failed to ${uploadMode} ${type}`, {
        description: errorMessage,
      });
    }
  };

  // --- Bulk Preview Handler ---

  const handleBulkPreview = async (fileKey: BulkFileKey) => {
    const file = bulkFiles[fileKey];
    if (!file) return;

    setLoadingPreview(fileKey);
    try {
      const preview = await previewCSVFile(file, 10);
      setBulkPreviews((prev) => ({ ...prev, [fileKey]: preview }));
      toast.success(`Preview loaded for ${fileKey.replace(/_/g, " ")}`);
    } catch (error) {
      toast.error("Failed to preview file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoadingPreview(null);
    }
  };

  // --- Bulk Upload Handlers ---

  const isBulkReady = Object.values(bulkFiles).every((f) => f !== null);

  const handleBulkUpload = async () => {
    if (!isBulkReady) {
      toast.error("Missing files", {
        description: "Please select all 6 required files.",
      });
      return;
    }

    // Check for missing columns in ALL selected files (even if not previewed)
    const filesWithErrors: string[] = [];

    for (const config of BULK_FILE_CONFIGS) {
      const file = bulkFiles[config.id];
      if (!file) continue;

      try {
        const validation = await validateCSVFile({
          file,
          requiredColumns: config.requiredColumns,
        });

        if (!validation.isValid) {
          filesWithErrors.push(
            `${config.label}: ${validation.errors.join(", ")}`,
          );
        }
      } catch (error) {
        filesWithErrors.push(`${config.label}: Failed to read file`);
      }
    }

    if (filesWithErrors.length > 0) {
      toast.error("File Validation Failed", {
        description: `The following files have errors:\n${filesWithErrors.join("\n")}\n\nPlease fix these files before uploading.`,
        duration: 8000,
      });
      return;
    }

    setBulkStatus({
      isBulkUploading: true,
      bulkProgress: 0,
      bulkError: null,
      bulkSuccess: false,
    });
    setBulkParsedError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setBulkStatus((prev) => ({
        bulkProgress: prev.bulkProgress >= 90 ? 90 : prev.bulkProgress + 5,
      }));
    }, 300);

    try {
      // Cast to the expected structure since we verified all are not null
      const files = bulkFiles as {
        lessons_file: File;
        concepts_file: File;
        examples_file: File;
        exercises_file: File;
        general_exercises_file: File;
        check_markers_file: File;
      };

      const result: ApiResponse = await uploadAllLessonFiles(files);

      clearInterval(progressInterval);

      if (result.success) {
        const report = createLessonUploadReport(result, "Bulk Upload", "upload");
        if (report) {
          saveLessonUploadReport(report);
        }

        setBulkStatus({
          isBulkUploading: false,
          bulkProgress: 100,
          bulkSuccess: true,
        });
        setBulkParsedError(null);
        toast.success("All files uploaded successfully", {
          description: result.message || "The database has been updated.",
        });

        if (hasLessonUploadIssues(report)) {
          router.push("/dashboard/superadmin/uploads/results");
        }
      } else {
        throw new Error(result.message || "Bulk upload failed");
      }
    } catch (error: any) {
      clearInterval(progressInterval);

      // Parse the error if it has response and data
      let parsedError: ParsedUploadError | null = null;
      let errorMessage =
        error.message || "An unexpected error occurred during bulk upload";

      if (error.response && error.data) {
        parsedError = parseUploadError(error.response, error.data);
        errorMessage = parsedError.userMessage;
        setBulkParsedError(parsedError);
      } else {
        setBulkParsedError(null);
      }

      setBulkStatus({
        isBulkUploading: false,
        bulkProgress: 0,
        bulkError: errorMessage,
      });
      toast.error("Bulk Upload Failed", { description: errorMessage });
    }
  };

  return (
    <div className="space-y-8 duration-500 animate-in slide-in-from-right-4">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileUp className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Content Uploads
            </h1>
            <p className="text-muted-foreground">
              Upload lesson content files to the platform
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/public/lesson-csv-files/lesson-structure.csv" download>
              <Download className="mr-2 size-4" />
              Download Templates
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/docs/superadmin-uploads-csv-contracts" target="_blank">
              <BookOpen className="mr-2 size-4" />
              Upload Contract Doc
            </a>
          </Button>
        </div>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <BookOpen className="size-4" />
        <AlertTitle>Upload Guidance</AlertTitle>
        <AlertDescription>
          For best results, use the <strong>pipe (|)</strong> delimiter. Always
          ensure your CSV follows the canonical format in the{" "}
          <a
            href="/docs/superadmin-uploads-csv-contracts"
            className="font-medium underline underline-offset-4"
          >
            Upload Contracts Documentation
          </a>{" "}
          and matches the{" "}
          <a
            href="/public/lesson-csv-files/lesson-structure.csv"
            className="font-medium underline underline-offset-4"
          >
            Template Files
          </a>
          .
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Individual Uploads Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Individual Uploads
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload or update specific content files one by one
              </p>
            </div>
            <Tabs
              value={uploadMode}
              onValueChange={(value) =>
                setUploadMode(value as LessonUploadMode)
              }
            >
              <TabsList>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="update">Update</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {UPLOAD_CONFIG.map((config) => (
            <div key={config.id} className="space-y-4">
              <FileUpload
                fileType={config.id}
                title={config.title}
                description={config.description}
                onFileSelect={(file) => handleFileSelect(config.id, file)}
                onFileRemove={() => handleFileRemove(config.id)}
                selectedFile={uploadStates[config.id].selectedFile}
                isUploading={uploadStates[config.id].isUploading}
                uploadProgress={uploadStates[config.id].uploadProgress}
                error={uploadStates[config.id].error}
                parsedError={uploadStates[config.id].parsedError}
                success={uploadStates[config.id].success}
                onRetry={() => handleUpload(config.id)}
              />
              {uploadStates[config.id].selectedFile &&
                !uploadStates[config.id].success &&
                !uploadStates[config.id].isUploading && (
                  <Button
                    className="w-full"
                    onClick={() => handleUpload(config.id)}
                    disabled={uploadMode === "update" && !config.updateFn}
                  >
                    <Upload className="mr-2 size-4" />
                    {uploadMode === "update" && config.updateFn
                      ? "Update"
                      : "Upload"}{" "}
                    {config.title}
                  </Button>
                )}
              {uploadMode === "update" && !config.updateFn && (
                <p className="text-xs text-muted-foreground">
                  Update endpoint is not available for this file type yet.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Bulk Upload Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Bulk Upload
            </h2>
            <Badge variant="secondary" className="text-xs">
              All-In-One
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload all 6 lesson files at once for faster processing
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            {bulkParsedError ? (
              <div className="mb-6">
                <UploadErrorDisplay
                  error={bulkParsedError}
                  onRetry={handleBulkUpload}
                />
              </div>
            ) : bulkError ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="size-4" />
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>{bulkError}</AlertDescription>
              </Alert>
            ) : null}

            {bulkSuccess && (
              <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="size-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  All files have been uploaded and processed successfully.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {BULK_FILE_CONFIGS.map((fileConfig) => {
                const file = bulkFiles[fileConfig.id];
                const preview = bulkPreviews[fileConfig.id];
                const isLoadingThisPreview = loadingPreview === fileConfig.id;

                // Check for missing columns
                const missingColumns = preview
                  ? fileConfig.requiredColumns.filter(
                      (col) =>
                        !preview.headers
                          .map((h) => h.toLowerCase())
                          .includes(col.toLowerCase()),
                    )
                  : [];

                return (
                  <div key={fileConfig.id} className="space-y-3">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor={fileConfig.id}>{fileConfig.label}</Label>
                      <Input
                        id={fileConfig.id}
                        type="file"
                        accept=".csv,.txt"
                        disabled={isBulkUploading || bulkSuccess}
                        onChange={(e) => {
                          setBulkFile(
                            fileConfig.id,
                            e.target.files?.[0] || null,
                          );
                          // Clear preview when file changes
                          setBulkPreviews((prev) => ({
                            ...prev,
                            [fileConfig.id]: null,
                          }));
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        {file?.name || "No file selected"}
                      </p>
                    </div>

                    {file && !preview && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleBulkPreview(fileConfig.id)}
                        disabled={isLoadingThisPreview || isBulkUploading}
                      >
                        <Eye className="mr-2 size-4" />
                        {isLoadingThisPreview ? "Loading..." : "Preview File"}
                      </Button>
                    )}

                    {preview && (
                      <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Preview</p>
                          <Badge variant="outline" className="text-xs">
                            {preview.totalRowCount} rows
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="text-muted-foreground">
                            Format:{" "}
                            <span className="font-medium">
                              {preview.format}-delimited
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Columns:{" "}
                            <span className="font-medium">
                              {preview.headers.length}
                            </span>
                          </p>
                        </div>

                        {missingColumns.length > 0 && (
                          <Alert variant="destructive" className="py-2">
                            <AlertCircle className="size-4" />
                            <AlertDescription className="text-xs">
                              Missing: {missingColumns.join(", ")}
                            </AlertDescription>
                          </Alert>
                        )}

                        {missingColumns.length === 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="size-3" />
                            <span>All required columns present</span>
                          </div>
                        )}

                        {preview.sampleRows.length > 0 && (
                          <div className="mt-2">
                            <p className="mb-1 text-xs text-muted-foreground">
                              Sample (first{" "}
                              {Math.min(5, preview.sampleRows.length)} rows):
                            </p>
                            <div className="max-h-32 overflow-auto rounded border bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {preview.headers
                                      .slice(0, 3)
                                      .map((header, idx) => (
                                        <TableHead
                                          key={idx}
                                          className="px-2 py-1 text-xs"
                                        >
                                          {header}
                                        </TableHead>
                                      ))}
                                    {preview.headers.length > 3 && (
                                      <TableHead className="px-2 py-1 text-xs">
                                        ...
                                      </TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {preview.sampleRows
                                    .slice(0, 5)
                                    .map((row, rowIdx) => (
                                      <TableRow key={rowIdx}>
                                        {row
                                          .slice(0, 3)
                                          .map((cell, cellIdx) => (
                                            <TableCell
                                              key={cellIdx}
                                              className="max-w-[100px] truncate px-2 py-1 text-xs"
                                            >
                                              {cell || (
                                                <span className="italic text-muted-foreground">
                                                  empty
                                                </span>
                                              )}
                                            </TableCell>
                                          ))}
                                        {row.length > 3 && (
                                          <TableCell className="px-2 py-1 text-xs">
                                            ...
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleBulkPreview(fileConfig.id)}
                          disabled={isLoadingThisPreview}
                        >
                          <Eye className="mr-1 size-3" />
                          Refresh Preview
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isBulkUploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing bulk upload... {bulkProgress}%</span>
                </div>
                <Progress value={bulkProgress} className="h-2" />
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {bulkSuccess && (
                <Button onClick={resetBulkState} variant="outline" size="lg">
                  Reset & Upload New Files
                </Button>
              )}
              <Button
                onClick={handleBulkUpload}
                disabled={!isBulkReady || isBulkUploading || bulkSuccess}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isBulkUploading ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 size-4" />
                    Upload All Files
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
