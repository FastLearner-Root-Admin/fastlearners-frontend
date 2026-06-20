"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileWarning,
} from "lucide-react";

import {
  clearLessonUploadReport,
  readLessonUploadReport,
  type LessonUploadReport,
} from "@/lib/api/lesson-upload-results";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UploadResultsPage() {
  const [report, setReport] = useState<LessonUploadReport | null>(null);

  useEffect(() => {
    setReport(readLessonUploadReport());
  }, []);

  const fieldNames = useMemo(() => {
    if (!report) return [];

    return Array.from(
      new Set(report.items.flatMap((item) => Object.keys(item.fields))),
    ).slice(0, 6);
  }, [report]);

  const handleClear = () => {
    clearLessonUploadReport();
    setReport(null);
  };

  if (!report) {
    return (
      <div className="space-y-6 duration-500 animate-in slide-in-from-right-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/superadmin/uploads">
            <ArrowLeft className="mr-2 size-4" />
            Back to Uploads
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>No upload result found</CardTitle>
            <CardDescription>
              Run a lesson upload or update to review the processing summary.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hasIssues = report.skippedCount > 0 || report.items.length > 0;

  return (
    <div className="space-y-6 duration-500 animate-in slide-in-from-right-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/superadmin/uploads">
            <ArrowLeft className="mr-2 size-4" />
            Back to Uploads
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear Result
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Lesson {report.mode === "update" ? "Update" : "Upload"} Result
          </h1>
          <Badge variant={hasIssues ? "secondary" : "default"}>
            {report.title}
          </Badge>
        </div>
        <p className="text-muted-foreground">{report.message}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processed</CardDescription>
            <CardTitle className="text-3xl">{report.processedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Skipped / Failed</CardDescription>
            <CardTitle className="text-3xl">{report.skippedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              {hasIssues ? (
                <>
                  <AlertTriangle className="size-5 text-amber-500" />
                  Partial Success
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5 text-green-600" />
                  Complete
                </>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {hasIssues ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="size-5 text-amber-500" />
              Rows That Need Attention
            </CardTitle>
            <CardDescription>
              Correct these rows in the CSV and re-upload or update the file.
              Already processed rows can be skipped by the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Type</TableHead>
                    {fieldNames.map((field) => (
                      <TableHead key={field} className="capitalize">
                        {field.replace(/_/g, " ")}
                      </TableHead>
                    ))}
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.items.map((item, index) => (
                    <TableRow key={`${item.type}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      {fieldNames.map((field) => (
                        <TableCell key={field} className="max-w-[220px]">
                          <span className="line-clamp-2">
                            {item.fields[field] || "-"}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="max-w-[320px]">
                        <span className="line-clamp-3">
                          {item.reason || "No reason provided"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="size-4" />
          <AlertTitle>Everything processed successfully</AlertTitle>
          <AlertDescription>
            No skipped rows were returned by the backend.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
