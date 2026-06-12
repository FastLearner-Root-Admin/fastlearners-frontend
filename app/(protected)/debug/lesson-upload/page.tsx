"use client";

import { useState } from "react";

import { UPLOAD_CONFIGS } from "@/lib/api/lesson-upload";
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
import { ErrorDiagnostics } from "@/components/upload/ErrorDiagnostics";
import { FileUploadCard } from "@/components/upload/FileUploadCard";

export default function DebugLessonUploadPage() {
  const [completedUploads, setCompletedUploads] = useState<Set<string>>(
    new Set(),
  );
  const [logs, setLogs] = useState<
    Array<{
      type: "success" | "error" | "info";
      message: string;
      timestamp: Date;
    }>
  >([]);

  const addLog = (type: "success" | "error" | "info", message: string) => {
    setLogs((prev) =>
      [
        {
          type,
          message,
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 20),
    ); // Keep only last 20 logs
  };

  const handleUploadSuccess = (configKey: string) => {
    setCompletedUploads((prev) => new Set([...Array.from(prev), configKey]));
    addLog("success", `Successfully uploaded ${configKey}`);
  };

  const isUploadEnabled = (config: (typeof UPLOAD_CONFIGS)[number]) => {
    if (!config.dependency) return true;
    return completedUploads.has(config.dependency);
  };

  const resetProgress = () => {
    setCompletedUploads(new Set());
    setLogs([]);
    addLog("info", "Reset all upload progress");
  };

  return (
    <div className="container space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold">Debug: Lesson Upload System</h1>
        <p className="mt-2 text-muted-foreground">
          Test the lesson upload functionality with real API calls
        </p>
      </div>

      {/* Progress Status */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Progress</CardTitle>
          <CardDescription>Current status of lesson uploads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="space-x-2">
              <Badge variant="outline">
                Completed: {completedUploads.size}/{UPLOAD_CONFIGS.length}
              </Badge>
              <Badge
                variant={
                  completedUploads.size === UPLOAD_CONFIGS.length
                    ? "default"
                    : "secondary"
                }
              >
                {completedUploads.size === UPLOAD_CONFIGS.length
                  ? "Complete"
                  : "In Progress"}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={resetProgress}>
              Reset Progress
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Upload Order:</p>
            <div className="flex flex-wrap gap-2">
              {[...UPLOAD_CONFIGS]
                .sort((a, b) => a.order - b.order)
                .map((config) => (
                  <Badge
                    key={config.key}
                    variant={
                      completedUploads.has(config.key) ? "default" : "outline"
                    }
                  >
                    {config.order}. {config.title}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...UPLOAD_CONFIGS]
          .sort((a, b) => a.order - b.order)
          .map((config) => {
            const isEnabled = isUploadEnabled(config);
            const isCompleted = completedUploads.has(config.key);

            return (
              <FileUploadCard
                key={config.key}
                title={`${config.order}. ${config.title}`}
                description={config.description}
                onUpload={async (file) => {
                  addLog(
                    "info",
                    `Starting upload of ${config.title} (${file.name})`,
                  );
                  try {
                    const result = await config.uploadFunction(file);
                    if (result.success) {
                      handleUploadSuccess(config.key);
                      addLog("success", `${config.title}: ${result.message}`);
                    } else {
                      addLog(
                        "error",
                        `${config.title}: ${result.error || result.message}`,
                      );
                    }
                    return result;
                  } catch (error: any) {
                    addLog(
                      "error",
                      `${config.title}: ${error.message || "Unexpected error"}`,
                    );
                    throw error;
                  }
                }}
                disabled={!isEnabled}
                completed={isCompleted}
                className={
                  !isEnabled
                    ? "opacity-50"
                    : isCompleted
                      ? "border-green-200 bg-green-50/50"
                      : ""
                }
              />
            );
          })}
      </div>

      <Separator />

      {/* Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Logs</CardTitle>
          <CardDescription>
            Real-time logs of upload attempts and results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No logs yet. Try uploading a file.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`rounded border-l-4 p-2 text-sm ${
                    log.type === "success"
                      ? "border-green-500 bg-green-50/50"
                      : log.type === "error"
                        ? "border-red-500 bg-red-50/50"
                        : "border-blue-500 bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex-1">{log.message}</span>
                    <Badge
                      variant={
                        log.type === "success"
                          ? "default"
                          : log.type === "error"
                            ? "destructive"
                            : "secondary"
                      }
                      className="ml-2 text-xs"
                    >
                      {log.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {log.timestamp.toLocaleTimeString()}
                  </p>
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
          <CardDescription>Current API settings and endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Base URL:</h4>
              <code className="rounded bg-muted px-2 py-1 text-sm">
                <p>
                  Base URL:{" "}
                  {process.env.NEXT_PUBLIC_API_URL ||
                    "https://app.fastlearnersapp.com/api/v1"}
                </p>
              </code>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Upload Endpoints:</h4>
              <div className="space-y-1">
                {UPLOAD_CONFIGS.map((config) => (
                  <div key={config.key} className="text-sm">
                    <code className="mr-2 rounded bg-muted px-2 py-1 text-xs">
                      POST
                    </code>
                    <span className="text-muted-foreground">
                      /superadmin/lessons/uploads/
                      {config.key === "general_exercises"
                        ? "general-exercises"
                        : config.key === "check_markers"
                          ? "check-markers"
                          : config.key === "scheme_of_work"
                            ? "scheme-of-work"
                            : config.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Required Headers:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  •{" "}
                  <code>
                    Authorization: Bearer {"{"}token{"}"}
                  </code>
                </li>
                <li>
                  • <code>Accept: application/json</code>
                </li>
                <li>
                  • <code>Content-Type: multipart/form-data</code>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
