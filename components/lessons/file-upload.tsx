"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { type ParsedUploadError } from "@/lib/api/upload-error-handler";
import {
  CSV_COLUMNS,
  previewCSVFile,
  type CSVPreviewResult,
} from "@/lib/utils/csv-upload-helper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UploadErrorDisplay } from "@/components/upload/UploadErrorDisplay";

// CSV_COLUMNS are now imported from csv-upload-helper

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  fileType: keyof typeof CSV_COLUMNS;
  title: string;
  description: string;
  selectedFile?: File | null;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  parsedError?: ParsedUploadError;
  success?: boolean;
  maxSize?: number; // in MB
  showPreviewButton?: boolean; // defaults to true
  onRetry?: () => void;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  fileType,
  title,
  description,
  selectedFile = null,
  isUploading = false,
  uploadProgress = 0,
  error = null,
  parsedError,
  success = false,
  maxSize = 10,
  showPreviewButton = true,
  onRetry,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<CSVPreviewResult | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const validateFile = (file: File): string[] => {
    const errors: string[] = [];

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      errors.push(
        `File size (${fileSizeInMB.toFixed(2)}MB) exceeds maximum allowed size of ${maxSize}MB`,
      );
    }

    // Check file type
    const allowedTypes = [".csv", ".txt"];
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`Invalid file type. Only CSV and TXT files are allowed.`);
    }

    // Basic content validation (we can't fully validate CSV structure without parsing)
    if (
      file.type &&
      !["text/csv", "text/plain", "application/csv"].includes(file.type)
    ) {
      errors.push(
        "File appears to be in wrong format. Please ensure it's a CSV or TXT file.",
      );
    }

    return errors;
  };

  const handleFileSelection = (file: File) => {
    const errors = validateFile(file);
    setValidationErrors(errors);

    if (errors.length === 0) {
      onFileSelect(file);
      toast.success(`${file.name} selected successfully`);
    } else {
      toast.error(`File validation failed: ${errors[0]}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleRemoveFile = () => {
    onFileRemove();
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("File removed");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getExpectedColumns = (): readonly string[] => {
    return CSV_COLUMNS[fileType] || [];
  };

  const handlePreviewFile = async () => {
    if (!selectedFile) return;

    setIsLoadingPreview(true);
    try {
      const preview = await previewCSVFile(selectedFile, 20);
      setPreviewData(preview);
      setIsPreviewOpen(true);
    } catch (error) {
      toast.error("Failed to preview file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <Card
      className={`transition-all duration-200 ${
        success
          ? "border-green-200 bg-green-50/30"
          : error || parsedError || validationErrors.length > 0
            ? "border-red-200 bg-red-50/30"
            : dragActive
              ? "border-primary bg-primary/5"
              : ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {success && <CheckCircle className="size-6 text-green-600" />}
          {(error || parsedError || validationErrors.length > 0) && (
            <AlertCircle className="size-6 text-red-600" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!selectedFile && (
          <div
            className={`rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
              dragActive
                ? "scale-[1.02] border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
            } ${isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full transition-all duration-200 ${
                dragActive ? "bg-primary/20" : "bg-muted"
              }`}
            >
              <Upload
                className={`size-8 transition-all duration-200 ${
                  dragActive
                    ? "scale-110 text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {dragActive
                  ? "Drop your file here"
                  : "Choose a file or drag it here"}
              </p>
              <p className="text-sm text-muted-foreground">
                CSV or TXT files only, up to {maxSize}MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </Button>
            </div>
          </div>
        )}

        {/* Selected File Info */}
        {selectedFile && (
          <div className="space-y-3 rounded-lg border-2 bg-background p-4 duration-300 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="size-8 text-primary" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {success && (
                  <Badge className="bg-green-100 text-green-800">
                    Uploaded
                  </Badge>
                )}
                {showPreviewButton && !isUploading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewFile}
                    disabled={isLoadingPreview}
                  >
                    <Eye className="mr-1 size-4" />
                    Preview
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2 duration-300 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span>Uploading...</span>
                  </div>
                  <span className="text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert
            variant="destructive"
            className="border-2 duration-300 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                <AlertCircle className="size-5" />
              </div>
              <AlertDescription className="flex-1">
                <div className="mb-2 font-semibold">Validation Failed</div>
                <ul className="space-y-1 text-sm">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5 text-red-500">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Error Message */}
        {parsedError ? (
          <UploadErrorDisplay
            error={parsedError}
            fileName={selectedFile?.name}
            onRetry={onRetry}
          />
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Success Message */}
        {success && (
          <Alert className="border-2 border-green-200 bg-green-50 duration-300 animate-in fade-in slide-in-from-bottom-2 dark:bg-green-950">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <AlertDescription className="font-medium text-green-800 dark:text-green-200">
                File uploaded successfully!
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Expected Columns Info */}
        <details className="group overflow-hidden rounded-lg border bg-muted/30">
          <summary className="flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <svg
                className="size-4 transition-transform group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <h4 className="text-sm font-semibold">Expected CSV Columns</h4>
            </div>
            <Badge variant="secondary" className="text-xs">
              {getExpectedColumns().length} columns
            </Badge>
          </summary>
          <div className="space-y-2 p-3 pt-0">
            <div className="flex flex-wrap gap-1.5">
              {getExpectedColumns().map((column, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="font-mono text-xs"
                >
                  {column}
                </Badge>
              ))}
            </div>
            <p className="border-t pt-2 text-xs text-muted-foreground">
              💡 Use pipe (|) as column delimiter. The parser also supports
              comma-delimited files, but pipe is recommended for consistency.
              Ensure all required columns are present.
            </p>
          </div>
        </details>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          {previewData && selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {previewData.format}
                    -delimited
                  </p>
                </div>
                <Badge variant="outline">
                  {previewData.totalRowCount} data rows
                </Badge>
              </div>

              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  Showing first {Math.min(20, previewData.sampleRows.length)}{" "}
                  rows of this file
                </p>
              </div>

              <div className="rounded-lg border">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewData.headers.map((header, idx) => (
                          <TableHead key={idx} className="font-semibold">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.sampleRows.map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <TableCell
                              key={cellIdx}
                              className="max-w-xs truncate"
                            >
                              {cell || (
                                <span className="italic text-muted-foreground">
                                  empty
                                </span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
