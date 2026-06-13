"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

import {
  acceptGuardianRequest,
  getStudentGuardianRequestHistory,
  rejectGuardianRequest,
} from "@/lib/api/guardian";
import { GuardianRequestItem } from "@/lib/types/guardian";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showApiToast } from "@/lib/utils/api-toast";

export function GuardiansForm() {
  const [history, setHistory] = useState<GuardianRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStudentGuardianRequestHistory();
      if (data.success) {
        setHistory(data.content?.history.request_history || []);
      } else {
        const msg = data.code === 500
          ? "Unable to load guardian requests right now. Please try again later."
          : data.message;
        setError(msg);
      }
    } catch (err) {
      setError("Unable to load guardian requests right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAction = async (id: number, action: "accept" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    const result =
      action === "accept"
        ? await acceptGuardianRequest(id)
        : await rejectGuardianRequest(id);

    if (result.success) {
      await fetchHistory();
    } else {
      showApiToast("error", result.message || "Action failed. Please try again.");
    }
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" onClick={fetchHistory} className="mt-4">
          Try Again
        </Button>
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Clock className="mb-4 size-12" />
          <p className="text-lg font-medium">No guardian requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{item.guardian_name}</span>
              <Badge
                variant={item.status === "pending" ? "secondary" : "outline"}
                className="capitalize"
              >
                {item.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {item.guardian_email}
            </p>
            {item.response_date && (
              <p className="text-xs text-muted-foreground">
                Date: {new Date(item.response_date).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() =>
                item.status === "pending" && handleAction(item.id, "reject")
              }
              disabled={item.status !== "pending" || actionLoading[item.id]}
            >
              {actionLoading[item.id] ? "Processing..." : "Reject"}
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              onClick={() =>
                item.status === "pending" && handleAction(item.id, "accept")
              }
              disabled={item.status !== "pending" || actionLoading[item.id]}
            >
              <CheckCircle2 className="mr-2 size-4" />
              {actionLoading[item.id] ? "Processing..." : "Accept"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
