"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Loader2, XCircle } from "lucide-react";

import {
  cancelRegistration,
  getRegistrationHistory,
} from "@/lib/api/quiz-competition";
import { PaginationMeta, QuizRegistration } from "@/lib/types/quiz-competition";
import { getRegistrationStatusBadge } from "@/lib/utils/quiz-status";
import { showApiToast } from "@/lib/utils/api-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function QuizRegistrationHistoryPage() {
  const [registrations, setRegistrations] = useState<QuizRegistration[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  async function fetchHistory(page = 1) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRegistrationHistory(page);
      if (response.code === 404 || response.type === "info") {
        setRegistrations([]);
        setMeta(null);
      } else if (response.success && response.content?.quizzes) {
        setRegistrations(response.content.quizzes.quizzes || []);
        setMeta(response.content.quizzes.meta || null);
      } else {
        setError(response.message || "Failed to load registration history.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCancel = async (registration: QuizRegistration) => {
    setCancellingId(registration.id);
    try {
      const response = await cancelRegistration(registration.id);
      if (response.success) {
        showApiToast("success", response.message || "Registration cancelled.");
        fetchHistory(meta?.current_page || 1);
      } else {
        showApiToast(
          response.type ?? "error",
          response.message || "Failed to cancel registration.",
        );
      }
    } catch (err) {
      showApiToast("error", "An error occurred while cancelling.");
    } finally {
      setCancellingId(null);
    }
  };

  const columns: ColumnDef<QuizRegistration>[] = [
    {
      accessorKey: "competition_title",
      header: "Competition",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.competition_title}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {row.original.competition_code}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "user_code",
      header: "Quiz User Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.user_code}</span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => `${row.original.lga}, ${row.original.state}`,
    },
    {
      accessorKey: "competition_date",
      header: "Competition Date",
    },
    {
      accessorKey: "registration_status",
      header: "Status",
      cell: ({ row }) =>
        getRegistrationStatusBadge(row.original.registration_status),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.registration_status === "approved" ||
        row.original.registration_status === "pending" ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => handleCancel(row.original)}
            disabled={cancellingId === row.original.id}
          >
            {cancellingId === row.original.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
          </Button>
        ) : null,
    },
  ];

  const table = useReactTable({
    data: registrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Registrations</h1>
        <p className="text-muted-foreground">
          View and manage your quiz competition registrations.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-md border bg-card">
          <Table>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : registrations.length === 0 ? (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="trophy" />
          <EmptyPlaceholder.Title>No registrations yet</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            Browse open competitions to register for the FLNQC.
          </EmptyPlaceholder.Description>
          <Button asChild>
            <Link href="/dashboard/quizzes">Browse Competitions</Link>
          </Button>
        </EmptyPlaceholder>
      ) : (
        <>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHistory(meta.current_page - 1)}
                disabled={meta.current_page === 1}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {meta.current_page} of {meta.last_page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHistory(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
