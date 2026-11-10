"use client";

import { useEffect, useState } from "react";
import { CreditCard, Eye } from "lucide-react";
import { showApiToast } from "@/lib/utils/api-toast";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { adminGetTransactions } from "@/lib/api/superadmin-subscription";
import { AdminTransaction, PaginationMeta } from "@/lib/types/subscription";
import { normalizeAmount, parseDateString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function getStatusBadge(status: string) {
  switch (status) {
    case "success":
      return <Badge className="bg-emerald-100 capitalize text-emerald-800 hover:bg-emerald-100/80">{status}</Badge>;
    case "failed":
      return <Badge className="bg-red-100 capitalize text-red-800 hover:bg-red-100/80">{status}</Badge>;
    case "pending":
      return <Badge className="bg-amber-100 capitalize text-amber-800 hover:bg-amber-100/80">{status}</Badge>;
    default:
      return <Badge variant="secondary" className="capitalize">{status}</Badge>;
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions(page: number = 1) {
    setLoading(true);
    const res = await adminGetTransactions(page);
    if (res.success && res.content) {
      setTransactions(res.content.transactions || []);
      setMeta(res.content.meta || null);
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to fetch transactions");
    }
    setLoading(false);
  }

  function handlePageChange(newPage: number) {
    fetchTransactions(newPage);
  }

  const columns: ColumnDef<AdminTransaction>[] = [
    {
      id: "serial",
      header: "#",
      cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
    },
    {
      accessorKey: "user_name",
      header: "User Name",
      cell: ({ row }) => <span className="font-medium">{row.original.user_name}</span>,
    },
    {
      accessorKey: "user_email",
      header: "User Email",
    },
    {
      accessorKey: "package",
      header: "Package",
    },
    {
      accessorKey: "package_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.package_type}
        </Badge>
      ),
    },
    {
      id: "coupon_or_voucher",
      header: "Coupon / Voucher",
      cell: ({ row }) => row.original.coupon_code || row.original.voucher_code || "-",
    },
    {
      accessorKey: "reference",
      header: "Reference",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `₦${Number(normalizeAmount(row.original.amount)).toLocaleString()}`,
    },
    {
      accessorKey: "discount_amount",
      header: "Discount",
      cell: ({ row }) => `₦${Number(normalizeAmount(row.original.discount_amount)).toLocaleString()}`,
    },
    {
      accessorKey: "payment_amount",
      header: "Payment Amount",
      cell: ({ row }) => `₦${Number(normalizeAmount(row.original.payment_amount)).toLocaleString()}`,
    },
    {
      accessorKey: "gateway",
      header: "Gateway",
      cell: ({ row }) => <span className="capitalize">{row.original.gateway}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const val = row.original.created_at;
        return val ? parseDateString(val)?.toLocaleDateString() : "-";
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Link href={`/dashboard/superadmin/transactions/${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="size-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            View all payment transactions.
          </p>
        </div>
      </div>

      <div className="rounded-md border">
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
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[20px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto size-8" /></TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Card className="mx-4 mt-4 border-2 border-dashed bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <CreditCard className="mb-4 size-10 text-muted-foreground" />
                      <p className="text-muted-foreground">No transactions found</p>
                    </CardContent>
                  </Card>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(meta.current_page - 1)}
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
            onClick={() => handlePageChange(meta.current_page + 1)}
            disabled={meta.current_page === meta.last_page}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
