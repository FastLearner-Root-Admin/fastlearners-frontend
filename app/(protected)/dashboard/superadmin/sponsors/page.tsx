"use client";

import { useEffect, useState } from "react";
import { Gift, Pencil, Trash2, Plus, Search } from "lucide-react";
import { showApiToast } from "@/lib/utils/api-toast";

import {
  adminGetSponsors,
  adminDeleteSponsor,
  adminSearchSponsors,
} from "@/lib/api/superadmin-subscription";
import { Sponsor, PaginationMeta } from "@/lib/types/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { SponsorForm } from "@/components/superadmin/sponsor-form";
import { useDebounce } from "@/hooks/use-debounce";

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (debouncedSearch) {
      searchSponsors(debouncedSearch);
    } else {
      fetchSponsors();
    }
  }, [debouncedSearch]);

  async function fetchSponsors(page: number = 1) {
    setLoading(true);
    const res = await adminGetSponsors(page);
    if (res.success && res.content) {
      setSponsors(res.content.sponsors || []);
      setMeta(res.content.meta || null);
    } else if (res.code !== 400) {
      showApiToast(res.type ?? "error", res.message || "Failed to fetch sponsors");
    } else {
      setSponsors([]);
      setMeta(null);
    }
    setLoading(false);
  }

  async function searchSponsors(term: string, page: number = 1) {
    setLoading(true);
    const res = await adminSearchSponsors(term, page);
    if (res.success && res.content) {
      setSponsors(res.content.sponsors || []);
      setMeta(res.content.meta || null);
    } else {
      setSponsors([]);
      setMeta(null);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await adminDeleteSponsor(deletingId);
    if (res.success) {
      setSponsors((prev) => prev.filter((s) => s.id !== deletingId));
      showApiToast(res.type ?? "success", res.message || "Sponsor deleted");
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to delete sponsor");
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  function handlePageChange(newPage: number) {
    if (debouncedSearch) {
      searchSponsors(debouncedSearch, newPage);
    } else {
      fetchSponsors(newPage);
    }
  }

  function handleFormSuccess() {
    setIsCreateOpen(false);
    setEditingSponsor(null);
    if (debouncedSearch) {
      searchSponsors(debouncedSearch, meta?.current_page || 1);
    } else {
      fetchSponsors(meta?.current_page || 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sponsors</h2>
          <p className="text-muted-foreground">
            Manage organizations and individuals sponsoring voucher-funded packages.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create Sponsor
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sponsors..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto size-8" /></TableCell>
                </TableRow>
              ))
            ) : sponsors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Card className="mx-4 mt-4 border-2 border-dashed bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <Gift className="mb-4 size-10 text-muted-foreground" />
                      <p className="text-muted-foreground">No sponsors found</p>
                    </CardContent>
                  </Card>
                </TableCell>
              </TableRow>
            ) : (
              sponsors.map((sponsor) => (
                <TableRow key={sponsor.id}>
                  <TableCell className="font-medium">{sponsor.name}</TableCell>
                  <TableCell>{sponsor.organization_name}</TableCell>
                  <TableCell className="font-mono text-xs">{sponsor.code}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sponsor.email || sponsor.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sponsor.is_active ? "default" : "secondary"}>
                      {sponsor.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingSponsor(sponsor)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(sponsor.id)}
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
            <SheetTitle>Create Sponsor</SheetTitle>
          </SheetHeader>
          <SponsorForm
            mode="create"
            onSuccess={handleFormSuccess}
            onCancel={() => setIsCreateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingSponsor}
        onOpenChange={(open) => !open && setEditingSponsor(null)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit Sponsor</SheetTitle>
          </SheetHeader>
          {editingSponsor && (
            <SponsorForm
              mode="edit"
              initialData={editingSponsor}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditingSponsor(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        title="Delete Sponsor"
        description="Are you sure you want to delete this sponsor? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
