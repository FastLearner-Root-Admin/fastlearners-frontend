"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Calendar, ReceiptText, RefreshCw } from "lucide-react";

import {
  getPaymentStatus,
  getTransactionHistory,
} from "@/lib/api/subscription";
import { Transaction } from "@/lib/types/subscription";
import { showApiToast } from "@/lib/utils/api-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Helper for currency parsing
function formatCurrency(val: string | number | undefined | null) {
  if (!val) return "0";
  if (typeof val === "number") return val.toLocaleString();
  const normalized = val.toString().replace(/,/g, "");
  const num = Number(normalized);
  return isNaN(num) ? val : num.toLocaleString();
}

// Helper for date parsing (handles day-first like DD-MM-YYYY or DD/MM/YYYY)
function formatApiDate(dateStr: string | undefined | null) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString();
  }
  const parts = dateStr.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const year = parseInt(parts[3], 10);
    return new Date(year, month, day).toLocaleDateString();
  }
  return dateStr;
}

const getTransactionStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "success":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          Successful
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
          Failed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          Pending
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
          {status}
        </span>
      );
  }
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      setError(null);
      const response = await getTransactionHistory();
      // Handle 404 as empty state
      if (response.code === 404) {
        setTransactions([]);
        setError(null);
      } else if (
        response.success &&
        response.content &&
        response.content.length > 0
      ) {
        setTransactions(response.content[0].transactions || []);
      } else {
        setError(response.message || "Failed to load transactions.");
      }
      setIsLoading(false);
    }
    fetchTransactions();
  }, []);

  const handleVerify = async (transaction: Transaction) => {
    setVerifyingId(transaction.id);
    const response = await getPaymentStatus(transaction.reference);

    // Always update status if backend provided it, even on failure
    if (response.content?.transaction_details?.status) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transaction.id
            ? { ...t, status: response.content!.transaction_details.status }
            : t,
        ),
      );
    }

    if (response.success) {
      showApiToast(
        response.type ?? "success",
        response.message || "Payment verified successfully",
      );
    } else {
      showApiToast(
        response.type ?? "error",
        response.message || "Could not verify payment",
      );
    }
    setVerifyingId(null);
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "package",
      header: "Package",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.package}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `₦${formatCurrency(row.original.amount)}`,
    },
    {
      accessorKey: "discount_amount",
      header: "Discount Amount",
      cell: ({ row }) => `₦${formatCurrency(row.original.discount_amount)}`,
    },
    {
      accessorKey: "payment_amount",
      header: "Payment Amount",
      cell: ({ row }) => `₦${formatCurrency(row.original.payment_amount)}`,
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.reference}</span>
      ),
    },
    {
      id: "coupon_or_voucher",
      header: "Coupon / Voucher",
      cell: ({ row }) => {
        const code = row.original.coupon || row.original.voucher;
        return code ? (
          <span className="font-mono text-xs">{code}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getTransactionStatusBadge(row.original.status),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-sm">
            {formatApiDate(row.original.created_at)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const transaction = row.original;
        if (transaction.status === "pending") {
          const isVerifying = verifyingId === transaction.id;
          return (
            <Button
              variant="outline"
              size="sm"
              disabled={isVerifying}
              onClick={() => handleVerify(transaction)}
            >
              <RefreshCw
                className={`mr-2 size-4 ${isVerifying ? "animate-spin" : ""}`}
              />
              {isVerifying ? "Verifying..." : "Verify Payment"}
            </Button>
          );
        }
        return null;
      },
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View your payment history.</p>
        </div>
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead key={i}>
                    {typeof col.header === "string" ? col.header : "..."}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View your payment history.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">View your payment history.</p>
      </div>

      {!transactions || transactions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <ReceiptText className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No transactions found</h3>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t made any payments yet.
            </p>
          </CardContent>
        </Card>
      ) : (
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
