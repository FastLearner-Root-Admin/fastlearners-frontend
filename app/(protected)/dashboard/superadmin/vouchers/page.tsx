"use client";

import { useEffect, useState } from "react";
import { QrCode, Pencil, Trash2, Plus, Search } from "lucide-react";
import { showApiToast } from "@/lib/utils/api-toast";

import {
  adminGetVouchers,
  adminDeleteVoucher,
  adminSearchVouchers,
  adminSearchVouchersBySponsor,
  adminGetSponsors,
} from "@/lib/api/superadmin-subscription";
import { Sponsor, Voucher, PaginationMeta } from "@/lib/types/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { VoucherForm } from "@/components/superadmin/voucher-form";
import { useDebounce } from "@/hooks/use-debounce";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorFilter, setSponsorFilter] = useState<string>("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    adminGetSponsors().then((res) => {
      if (res.success && res.content) setSponsors(res.content.sponsors);
    });
  }, []);

  useEffect(() => {
    if (sponsorFilter) {
      filterBySponsor(sponsorFilter);
    } else if (debouncedSearch) {
      searchVouchers(debouncedSearch);
    } else {
      fetchVouchers();
    }
  }, [debouncedSearch, sponsorFilter]);

  async function fetchVouchers(page: number = 1) {
    setLoading(true);
    const res = await adminGetVouchers(page);
    if (res.success && res.content) {
      setVouchers(res.content.vouchers || []);
      setMeta(res.content.meta || null);
    } else if (res.code !== 404) {
      showApiToast(res.type ?? "error", res.message || "Failed to fetch vouchers");
    } else {
      setVouchers([]);
      setMeta(null);
    }
    setLoading(false);
  }

  async function searchVouchers(term: string, page: number = 1) {
    setLoading(true);
    const res = await adminSearchVouchers(term, page);
    if (res.success && res.content) {
      setVouchers(res.content.vouchers || []);
      setMeta(res.content.meta || null);
    } else {
      setVouchers([]);
      setMeta(null);
    }
    setLoading(false);
  }

  async function filterBySponsor(sponsorCode: string, page: number = 1) {
    setLoading(true);
    const res = await adminSearchVouchersBySponsor(sponsorCode, page);
    if (res.success && res.content) {
      setVouchers(res.content.vouchers || []);
      setMeta(res.content.meta || null);
    } else {
      setVouchers([]);
      setMeta(null);
      if (res.code !== 400) {
        showApiToast(res.type ?? "error", res.message || "Failed to filter vouchers");
      }
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await adminDeleteVoucher(deletingId);
    if (res.success) {
      setVouchers((prev) => prev.filter((v) => v.id !== deletingId));
      showApiToast(res.type ?? "success", res.message || "Voucher deleted");
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to delete voucher");
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  function handlePageChange(newPage: number) {
    if (sponsorFilter) {
      filterBySponsor(sponsorFilter, newPage);
    } else if (debouncedSearch) {
      searchVouchers(debouncedSearch, newPage);
    } else {
      fetchVouchers(newPage);
    }
  }

  function handleFormSuccess() {
    setIsCreateOpen(false);
    setEditingVoucher(null);
    if (sponsorFilter) {
      filterBySponsor(sponsorFilter, meta?.current_page || 1);
    } else if (debouncedSearch) {
      searchVouchers(debouncedSearch, meta?.current_page || 1);
    } else {
      fetchVouchers(meta?.current_page || 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vouchers</h2>
          <p className="text-muted-foreground">
            Generate and manage sponsor-funded voucher codes for free package access.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create Voucher(s)
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by code or reference..."
            className="pl-8"
            value={searchTerm}
            disabled={!!sponsorFilter}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={sponsorFilter || "all"}
          onValueChange={(val) => {
            setSponsorFilter(val === "all" ? "" : val);
            setSearchTerm("");
          }}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Filter by sponsor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sponsors</SelectItem>
            {sponsors.map((sponsor) => (
              <SelectItem key={sponsor.id} value={sponsor.code}>
                {sponsor.name} ({sponsor.organization_name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Sponsor</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto size-8" /></TableCell>
                </TableRow>
              ))
            ) : vouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Card className="mx-4 mt-4 border-2 border-dashed bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <QrCode className="mb-4 size-10 text-muted-foreground" />
                      <p className="text-muted-foreground">No vouchers found</p>
                    </CardContent>
                  </Card>
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-mono text-sm font-medium">{voucher.code}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{voucher.reference}</TableCell>
                  <TableCell>{voucher.sponsor.name}</TableCell>
                  <TableCell>{voucher.package.name}</TableCell>
                  <TableCell>
                    <Badge variant={voucher.is_valid ? "default" : "secondary"}>
                      {voucher.is_valid ? "Valid" : "Used / Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingVoucher(voucher)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(voucher.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
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

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create Voucher(s)</SheetTitle>
          </SheetHeader>
          <VoucherForm
            mode="create"
            onSuccess={handleFormSuccess}
            onCancel={() => setIsCreateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingVoucher}
        onOpenChange={(open) => !open && setEditingVoucher(null)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit Voucher</SheetTitle>
          </SheetHeader>
          {editingVoucher && (
            <VoucherForm
              mode="edit"
              initialData={editingVoucher}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditingVoucher(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        title="Delete Voucher"
        description="Are you sure you want to delete this voucher? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
