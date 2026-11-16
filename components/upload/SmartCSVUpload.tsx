"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CloudUpload,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { UPLOAD_CONFIGS } from "@/lib/api/lesson-upload";
import { CSV_COLUMNS } from "@/lib/utils/csv-upload-helper";
import { cn } from "@/lib/utils";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HorizontalScroll } from "@/components/shared/horizontal-scroll";

import { UploadLog, UploadLogs } from "./UploadLogs";

interface SmartCSVUploadProps {
  onUploadSuccess?: (configKey: string) => void;
  completedUploads?: Set<string>;
  className?: string;
}

interface FileUploadSectionProps {
  config: (typeof UPLOAD_CONFIGS)[number];
  onUpload: (
    file: File,
  ) => Promise<{ success: boolean; message: string; error?: string }>;
  disabled?: boolean;
  completed?: boolean;
}

// Single source of truth — column lists live in csv-upload-helper.ts
const REQUIRED_COLUMNS = CSV_COLUMNS;

function FileUploadSection({
  config,
  onUpload,
  disabled = false,
  completed = false,
}: FileUploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(completed);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validTypes = [".csv", ".txt"];
    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));

    if (!validTypes.includes(fileExtension)) {
      setError("Please select a CSV or TXT file");
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    try {
      const result = await onUpload(file);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setSuccess(true);
        toast.success(result.message);
      } else {
        setError(result.error || result.message);
        toast.error(result.error || result.message);
        setProgress(0);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      const errorMessage = err.message || "Upload failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const requiredColumns =
    REQUIRED_COLUMNS[config.key as keyof typeof REQUIRED_COLUMNS] || [];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card
        className={cn(
          "border-border transition-all duration-200 dark:border-border",
          disabled && "opacity-50",
          success &&
            "border-green-500 bg-green-50/50 dark:border-green-400 dark:bg-green-950/20",
          error &&
            "border-red-500 bg-red-50/50 dark:border-red-400 dark:bg-red-950/20",
        )}
      >
        <CardHeader className="p-component-sm sm:p-component-md">
          <CardTitle className="flex items-center gap-2 text-heading-md sm:gap-3 sm:text-heading-lg">
            <div
              className={cn(
                "rounded-lg p-1.5 sm:p-2",
                disabled
                  ? "bg-muted"
                  : success
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-blue-100 dark:bg-blue-900",
              )}
            >
              <FileText
                className={cn(
                  "size-4 sm:size-5",
                  disabled
                    ? "text-muted-foreground"
                    : success
                      ? "text-green-600 dark:text-green-400"
                      : "text-blue-600 dark:text-blue-400",
                )}
              />
            </div>
            <span className="text-sm sm:text-base">Upload {config.title}</span>
            {success && (
              <Check className="size-3.5 text-green-600 dark:text-green-400 sm:size-4" />
            )}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground sm:text-sm">
            {config.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-component-sm p-component-sm sm:space-y-component-md sm:p-component-md">
          {/* File Drop Zone */}
          {!file && !success && (
            <div
              className={cn(
                "min-h-[160px] rounded-lg border-2 border-dashed p-4 text-center transition-all duration-200 sm:min-h-[200px] sm:p-8",
                disabled
                  ? "cursor-not-allowed border-border bg-muted"
                  : isDragOver
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "cursor-pointer border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <CloudUpload
                className={cn(
                  "mx-auto mb-3 size-8 sm:mb-4 sm:size-12",
                  disabled ? "text-muted-foreground" : "text-muted-foreground",
                )}
              />
              <p className="mb-2 text-sm font-medium sm:text-base">
                {disabled
                  ? "Upload disabled"
                  : "Drop your CSV file here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Supports: .csv files (max 10MB)
              </p>
              {!disabled && (
                <Button
                  variant="outline"
                  className="mt-3 text-xs sm:mt-4 sm:text-sm"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Select {config.title} File
                </Button>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileSelect(selectedFile);
            }}
            disabled={disabled}
            className="hidden"
          />

          {/* Selected File Display */}
          {file && !success && (
            <div className="space-y-component-xs sm:space-y-component-sm">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-3 dark:bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex items-center gap-3">
                  <FileText className="size-6 text-primary sm:size-8" />
                  <div>
                    <p className="text-sm font-medium sm:text-base">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Badge
                    variant={error ? "destructive" : "secondary"}
                    className="text-[10px] sm:text-xs"
                  >
                    {error ? "Error" : "Ready"}
                  </Badge>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-component-xs">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Uploading...
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || disabled}
                className="w-full"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <span className="text-sm sm:text-base">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 size-4" />
                    <span className="text-sm sm:text-base">Upload File</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-900/20">
                <Check className="size-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <strong>{config.title}</strong> uploaded successfully!
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setFile(null);
                  setError(null);
                }}
                className="w-full"
              >
                Upload Another File
              </Button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Disabled State Message */}
          {disabled && !success && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                Complete the required dependencies first to enable this upload.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Required Format Section */}
      <Card>
        <CardHeader className="p-component-sm sm:p-component-md">
          <CardTitle className="text-base sm:text-lg">
            Required Format - {config.title}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your CSV file must include these columns in the correct order
          </CardDescription>
        </CardHeader>
        <CardContent className="p-component-sm sm:p-component-md">
          <div className="space-y-component-xs sm:space-y-component-sm">
            <p className="text-xs text-muted-foreground sm:text-sm">
              <strong>Required Columns:</strong>
            </p>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {requiredColumns.map((column) => (
                <Badge
                  key={column}
                  variant="secondary"
                  className="font-mono text-[10px] sm:text-xs"
                >
                  {column}
                </Badge>
              ))}
            </div>
            {config.key === "lessons" && (
              <div className="mt-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> The objectives, key_concepts, and
                  application columns should contain valid JSON arrays.
                </p>
              </div>
            )}
            <Link href="/superadmin/lessons/upload/bulk">
              <Button variant="outline" size="sm" className="mt-3">
                Bulk Upload
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SmartCSVUpload({
  onUploadSuccess,
  completedUploads = new Set(),
  className,
}: SmartCSVUploadProps) {
  const [logs, setLogs] = useState<UploadLog[]>([]);

  const addLog = (
    type: UploadLog["type"],
    message: string,
    configKey?: string,
    fileName?: string,
  ) => {
    setLogs((prev) =>
      [
        {
          type,
          message,
          timestamp: new Date(),
          configKey,
          fileName,
        },
        ...prev,
      ].slice(0, 50),
    ); // Keep only last 50 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleUploadSuccess = (configKey: string) => {
    onUploadSuccess?.(configKey);
    addLog("success", `Successfully uploaded ${configKey}`, configKey);
  };

  const isUploadEnabled = (config: (typeof UPLOAD_CONFIGS)[number]) => {
    if (!config.dependency) return true;
    return completedUploads.has(config.dependency);
  };

  const getUploadStatus = (configKey: string) => {
    if (completedUploads.has(configKey)) return "completed";
    const config = UPLOAD_CONFIGS.find((c) => c.key === configKey);
    if (config && isUploadEnabled(config)) return "enabled";
    return "disabled";
  };

  // Get active configs (exclude scheme_of_work for main tabs)
  const mainConfigs = UPLOAD_CONFIGS.filter(
    (config) => config.key !== "scheme_of_work",
  );
  const schemeOfWork = UPLOAD_CONFIGS.find(
    (config) => config.key === "scheme_of_work",
  );

  return (
    <div className={cn("w-full", className)}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Smart CSV Upload</CardTitle>
          <CardDescription>
            Upload lessons with intelligent parsing, validation, and preview
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="lessons" className="w-full">
        <HorizontalScroll className="mb-8 md:mb-10 md:pb-0">
          <TabsList className="flex h-12 min-w-full gap-1 bg-muted/40 dark:bg-muted/20 md:grid md:w-full md:grid-cols-7">
            {mainConfigs.map((config) => (
              <TabsTrigger
                key={config.key}
                value={config.key}
                className={cn(
                  "px-3 py-2 text-xs font-medium transition-all",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                disabled={!isUploadEnabled(config)}
              >
                {config.title}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="scheme_of_work"
              className="px-3 py-2 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Scheme of Work
            </TabsTrigger>
          </TabsList>
        </HorizontalScroll>

        {/* Main upload tabs */}
        {mainConfigs.map((config) => (
          <TabsContent key={config.key} value={config.key}>
            <FileUploadSection
              config={config}
              onUpload={async (file) => {
                addLog(
                  "info",
                  `Starting upload of ${config.title}`,
                  config.key,
                  file.name,
                );
                try {
                  const result = await config.uploadFunction(file);
                  if (result.success) {
                    handleUploadSuccess(config.key);
                    addLog(
                      "success",
                      `${config.title}: ${result.message}`,
                      config.key,
                      file.name,
                    );
                  } else {
                    addLog(
                      "error",
                      `${config.title}: ${result.error || result.message}`,
                      config.key,
                      file.name,
                    );
                  }
                  return result;
                } catch (error: any) {
                  addLog(
                    "error",
                    `${config.title}: ${error.message || "Unexpected error"}`,
                    config.key,
                    file.name,
                  );
                  throw error;
                }
              }}
              disabled={!isUploadEnabled(config)}
              completed={completedUploads.has(config.key)}
            />
          </TabsContent>
        ))}

        {/* Scheme of Work tab */}
        {schemeOfWork && (
          <TabsContent value="scheme_of_work">
            <FileUploadSection
              config={schemeOfWork}
              onUpload={async (file) => {
                addLog(
                  "info",
                  `Starting upload of ${schemeOfWork.title}`,
                  schemeOfWork.key,
                  file.name,
                );
                try {
                  const result = await schemeOfWork.uploadFunction(file);
                  if (result.success) {
                    handleUploadSuccess(schemeOfWork.key);
                    addLog(
                      "success",
                      `${schemeOfWork.title}: ${result.message}`,
                      schemeOfWork.key,
                      file.name,
                    );
                  } else {
                    addLog(
                      "error",
                      `${schemeOfWork.title}: ${result.error || result.message}`,
                      schemeOfWork.key,
                      file.name,
                    );
                  }
                  return result;
                } catch (error: any) {
                  addLog(
                    "error",
                    `${schemeOfWork.title}: ${error.message || "Unexpected error"}`,
                    schemeOfWork.key,
                    file.name,
                  );
                  throw error;
                }
              }}
              disabled={false}
              completed={completedUploads.has(schemeOfWork.key)}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Upload Logs */}
      <div className="mt-8">
        <UploadLogs logs={logs} onClearLogs={clearLogs} />
      </div>
    </div>
  );
}
