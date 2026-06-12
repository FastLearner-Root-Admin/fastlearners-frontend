"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  AlertCircle,
  Bug,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Info,
  RefreshCw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  uploadAllLessonFilesBulk,
  validateBulkUploadFiles,
  type BulkUploadFiles,
} from "@/lib/api/bulk-lesson-upload";
import { uploadCheckMarkersDirectly } from "@/lib/api/direct-check-markers-upload";
import {
  uploadCheckMarkersFile,
  uploadCheckMarkersFileWithValidation,
} from "@/lib/api/lesson-service";
import { uploadCheckMarkers } from "@/lib/api/lesson-upload";
import { uploadCheckMarkersSimple } from "@/lib/api/simple-upload-service";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DebugLog {
  timestamp: Date;
  type: "info" | "success" | "error" | "warning";
  message: string;
  data?: any;
}

export default function CheckMarkersUploadDebugPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const { user, isAuthenticated } = useAuthStore();

  const addLog = (type: DebugLog["type"], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date(),
      type,
      message,
      data,
    };
    setDebugLogs((prev) => [log, ...prev].slice(0, 50)); // Keep last 50 logs

    // Also log to console for additional debugging
    console.log(`[${type.toUpperCase()}] ${message}`, data ? data : "");
  };

  const clearLogs = () => {
    setDebugLogs([]);
    addLog("info", "Debug logs cleared");
  };

  const downloadSampleFile = () => {
    const sampleContent = `lesson,overview,lesson_video,concept_one,concept_two,concept_three,concept_four,concept_five,concept_six,concept_seven,general_exercises
Numbers and Counting,10,15,20,20,0,0,0,0,0,35
Addition Basics,10,15,25,25,0,0,0,0,0,25
The Alphabet,10,15,30,30,0,0,0,0,0,15`;

    const blob = new Blob([sampleContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_check_markers.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addLog("info", "Sample check-markers file downloaded");
  };

  const debugAuthState = async () => {
    addLog("info", "=== AUTH STATE DEBUG ===");

    // Check auth store
    addLog("info", `Auth Store - Authenticated: ${isAuthenticated}`);
    addLog("info", `Auth Store - User:`, user);

    // Check session API
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      addLog("info", `Session API Response:`, {
        success: data.success,
        code: data.code,
        message: data.message,
        hasUser: !!data.user,
      });
    } catch (error) {
      addLog("error", `Session API Error:`, error);
    }
  };

  const previewFileContent = async () => {
    if (!file) {
      addLog("warning", "No file selected for preview");
      return;
    }

    try {
      const content = await file.text();
      addLog(
        "info",
        `File preview (first 1000 chars):`,
        content.substring(0, 1000),
      );

      // Use shared preview helper
      const { previewCSVFile } = await import("@/lib/utils/csv-upload-helper");
      const preview = await previewCSVFile(file, 10);

      addLog(
        "info",
        `File analysis - Total lines: ${preview.totalRowCount + 1}`,
      );
      addLog("info", `Format detected: ${preview.format}-delimited`);
      addLog(
        "info",
        `Headers found (${preview.headers.length}):`,
        preview.headers,
      );

      const expectedHeaders = [
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
      ];
      const missingHeaders = expectedHeaders.filter(
        (h) => !preview.headers.includes(h),
      );

      if (missingHeaders.length > 0) {
        addLog("error", `Missing headers:`, missingHeaders);
      } else {
        addLog("success", "All required headers present");
      }

      if (preview.sampleRows.length > 0) {
        addLog(
          "info",
          `Sample rows (${preview.sampleRows.length}):`,
          preview.sampleRows,
        );
      }
    } catch (error) {
      addLog(
        "error",
        `Failed to preview file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const testUploadMethod = async (method: string) => {
    if (!file) {
      toast.error("Please select a file first");
      addLog("error", "No file selected for upload test");
      return;
    }

    setIsUploading(true);
    addLog("info", `=== TESTING ${method.toUpperCase()} METHOD ===`);

    try {
      let result;

      switch (method) {
        case "basic":
          addLog("info", "Using uploadCheckMarkersFile (basic method)");
          result = await uploadCheckMarkersFile(file);
          break;

        case "validated":
          addLog(
            "info",
            "Using uploadCheckMarkersFileWithValidation (smart method)",
          );
          result = await uploadCheckMarkersFileWithValidation(file);
          break;

        case "simple":
          addLog("info", "Using uploadCheckMarkersSimple (simple method)");
          result = await uploadCheckMarkersSimple(file);
          break;

        case "generic":
          addLog("info", "Using uploadCheckMarkers (generic method)");
          result = await uploadCheckMarkers(file);
          break;

        case "direct":
          addLog(
            "info",
            "Using uploadCheckMarkersDirectly (HTTPie-style direct method)",
          );
          result = await uploadCheckMarkersDirectly(file);
          break;

        default:
          throw new Error(`Unknown method: ${method}`);
      }

      addLog("info", `Upload result:`, result);

      if (result.success) {
        addLog("success", `✅ ${method} method succeeded: ${result.message}`);
        toast.success(`Upload successful with ${method} method!`);
      } else {
        addLog(
          "error",
          `❌ ${method} method failed: ${result.error || result.message}`,
        );
        toast.error(`Upload failed with ${method} method`);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || error.message || "Unknown error";
      addLog("error", `❌ ${method} method threw error: ${errorMsg}`);
      addLog("error", "Full error object:", error);
      toast.error(`${method} method error: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const testAllMethods = async () => {
    const methods = ["basic", "validated", "simple", "generic"];

    for (const method of methods) {
      await testUploadMethod(method);
      // Add a small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      addLog(
        "info",
        `File selected: ${selectedFile.name} (${selectedFile.size} bytes, ${selectedFile.type})`,
      );
    }
  };

  // Load the correct comma-delimited CSV for testing
  const loadCorrectCsvFile = () => {
    // Correct comma-delimited format that API expects
    const correctCsvContent = `lesson,overview,lesson_video,concept_one,concept_two,concept_three,concept_four,concept_five,concept_six,concept_seven,general_exercises
Number Bases System,5,5,20,25,25,0,0,0,0,20`;

    const blob = new Blob([correctCsvContent], { type: "text/csv" });
    const correctFile = new File([blob], "correct_check_markers.csv", {
      type: "text/csv",
    });
    setFile(correctFile);
    addLog("info", `✅ Loaded correct comma-delimited CSV format for testing`);
    addLog(
      "info",
      `File details: ${correctFile.name} (${correctFile.size} bytes)`,
    );
  };

  return (
    <div className="container space-y-8 pb-20">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Bug className="size-8" />
          Debug: Check-Markers Upload
        </h1>
        <p className="mt-2 text-muted-foreground">
          Comprehensive testing and debugging for check-markers upload
          functionality
        </p>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle className="size-4 text-green-500" />
                ) : (
                  <AlertCircle className="size-4 text-red-500" />
                )}
                <span>
                  Authentication:{" "}
                  {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </span>
              </div>
              {user && (
                <div className="text-sm text-muted-foreground">
                  User: {user.name} ({user.email}) - Role:{" "}
                  {user.role.join(", ")}
                </div>
              )}
            </div>
            <Button onClick={debugAuthState} variant="outline" size="sm">
              Debug Auth
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Selection and Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            File Selection & Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
              />
              {file && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Selected: {file.name} ({Math.round(file.size / 1024)}KB)
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadSampleFile} variant="outline" size="sm">
                <Download className="mr-2 size-4" />
                Download Sample
              </Button>
              <Button onClick={loadCorrectCsvFile} variant="default" size="sm">
                ✅ Load Correct Format
              </Button>
              <Button
                onClick={previewFileContent}
                variant="outline"
                size="sm"
                disabled={!file}
              >
                <Eye className="mr-2 size-4" />
                Preview File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Upload Testing
          </CardTitle>
          <CardDescription>
            Test different upload methods to identify which one works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="individual" className="w-full">
            <TabsList>
              <TabsTrigger value="individual">Individual Tests</TabsTrigger>
              <TabsTrigger value="batch">Batch Test</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  onClick={() => testUploadMethod("direct")}
                  disabled={!file || isUploading}
                  variant="default"
                >
                  🚀 Test Direct Upload (HTTPie-style)
                </Button>
                <Button
                  onClick={() => testUploadMethod("basic")}
                  disabled={!file || isUploading}
                  variant="outline"
                >
                  Test Basic Upload
                </Button>
                <Button
                  onClick={() => testUploadMethod("validated")}
                  disabled={!file || isUploading}
                  variant="outline"
                >
                  Test Validated Upload
                </Button>
                <Button
                  onClick={() => testUploadMethod("simple")}
                  disabled={!file || isUploading}
                  variant="outline"
                >
                  Test Simple Upload
                </Button>
                <Button
                  onClick={() => testUploadMethod("generic")}
                  disabled={!file || isUploading}
                  variant="outline"
                >
                  Test Generic Upload
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="batch">
              <div className="space-y-4">
                <Button
                  onClick={testAllMethods}
                  disabled={!file || isUploading}
                  className="w-full"
                  size="lg"
                >
                  {isUploading ? (
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 size-4" />
                  )}
                  Test All Methods
                </Button>
                <Alert>
                  <Info className="size-4" />
                  <AlertDescription>
                    This will test all upload methods sequentially. Check the
                    logs below for detailed results.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Separator />

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bug className="size-5" />
              Debug Logs
            </CardTitle>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear Logs
            </Button>
          </div>
          <CardDescription>
            Real-time debugging information and upload results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debugLogs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No logs yet. Start testing to see debug information here.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {debugLogs.map((log, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-l-4 p-3 text-sm ${
                    log.type === "success"
                      ? "border-green-500 bg-green-50/50"
                      : log.type === "error"
                        ? "border-red-500 bg-red-50/50"
                        : log.type === "warning"
                          ? "border-yellow-500 bg-yellow-50/50"
                          : "border-blue-500 bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            log.type === "success"
                              ? "default"
                              : log.type === "error"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {log.type}
                        </Badge>
                        <span className="font-medium">{log.message}</span>
                      </div>
                      {log.data && (
                        <pre className="mt-2 overflow-x-auto rounded bg-muted/50 p-2 text-xs">
                          {typeof log.data === "string"
                            ? log.data
                            : JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 text-sm">
            <div>
              <h4 className="mb-3 text-base font-medium">
                Check Markers Upload
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium">Endpoint:</h5>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Endpoint:{" "}
                    {process.env.NEXT_PUBLIC_API_URL ||
                      "https://app.fastlearnersapp.com/api/v1"}
                    /superadmin/lessons/uploads/check-markers
                  </p>
                </div>

                <div>
                  <h5 className="font-medium">Expected Form Field:</h5>
                  <code className="rounded bg-muted px-2 py-1">
                    check_markers_file
                  </code>
                </div>

                <div>
                  <h5 className="font-medium">Expected CSV Format:</h5>
                  <div className="rounded bg-muted p-3 font-mono text-xs">
                    lesson,overview,lesson_video,concept_one,concept_two,concept_three,concept_four,concept_five,concept_six,concept_seven,general_exercises
                    <br />
                    Number Bases System,5,5,20,25,25,0,0,0,0,20
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-base font-medium">
                Bulk Upload (All Lesson Files)
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium">Endpoint:</h5>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Endpoint:{" "}
                    {process.env.NEXT_PUBLIC_API_URL ||
                      "https://app.fastlearnersapp.com/api/v1"}
                    /superadmin/lessons/uploads/all-lesson-files
                  </p>
                </div>

                <div>
                  <h5 className="font-medium">Required Form Fields:</h5>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      lessons_file
                    </code>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      concepts_file
                    </code>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      examples_file
                    </code>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      exercises_file
                    </code>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      general_exercises_file
                    </code>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      check_markers_file
                    </code>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium">File Types:</h5>
                  <p className="text-muted-foreground">
                    Only CSV (.csv) or TXT (.txt) files are accepted
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-base font-medium">Common Headers</h4>
              <ul className="space-y-1">
                <li>
                  • <code>Authorization: Bearer {"{token}"}</code>
                </li>
                <li>
                  • <code>Accept: application/json</code>
                </li>
                <li>
                  • <code>Content-Type: multipart/form-data</code> (auto-set by
                  browser)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
