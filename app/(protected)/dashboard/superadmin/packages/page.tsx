"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package as PackageIcon, Pencil, Trash2, Plus } from "lucide-react";
import { showApiToast } from "@/lib/utils/api-toast";

import {
  adminGetPackages,
  adminDeletePackage,
  adminUpdatePackageStatus,
} from "@/lib/api/superadmin-subscription";
import { Package } from "@/lib/types/subscription";
import { normalizeAmount } from "@/lib/utils";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PackageForm } from "@/components/superadmin/package-form";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    setLoading(true);
    const res = await adminGetPackages();
    if (res.success && res.content) {
      setPackages(res.content.packages);
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to fetch packages");
    }
    setLoading(false);
  }

  async function handleToggleStatus(pkg: Package) {
    const res = await adminUpdatePackageStatus(pkg.id);
    if (res.success) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkg.id ? { ...p, is_active: !p.is_active } : p
        )
      );
      showApiToast(res.type ?? "success", res.message || "Package status updated");
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to update status");
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await adminDeletePackage(deletingId);
    if (res.success) {
      setPackages((prev) => prev.filter((p) => p.id !== deletingId));
      showApiToast(res.type ?? "success", res.message || "Package deleted");
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to delete package");
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Packages</h2>
          <p className="text-muted-foreground">
            Manage subscription packages for your users.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create Package
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Original Amount</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto size-8" /></TableCell>
                </TableRow>
              ))
            ) : packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Card className="mx-4 mt-4 border-2 border-dashed bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <PackageIcon className="mb-4 size-10 text-muted-foreground" />
                      <p className="text-muted-foreground">No packages found</p>
                    </CardContent>
                  </Card>
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/superadmin/packages/${pkg.id}`}
                      className="hover:underline"
                    >
                      {pkg.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {pkg.type}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{Number(normalizeAmount(pkg.amount)).toLocaleString()}</TableCell>
                  <TableCell>
                    {pkg.original_amount ? (
                      <span className="text-muted-foreground line-through">
                        ₦{Number(normalizeAmount(pkg.original_amount)).toLocaleString()}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{pkg.billing_cycle}</TableCell>
                  <TableCell>{pkg.duration_days} days</TableCell>
                  <TableCell>
                    <Badge
                      variant={pkg.is_active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(pkg)}
                    >
                      {pkg.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPackage(pkg)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(pkg.id)}
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

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create Package</SheetTitle>
          </SheetHeader>
          <PackageForm
            mode="create"
            onSuccess={(pkg) => {
              setPackages((prev) => [pkg, ...prev]);
              setIsCreateOpen(false);
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingPackage}
        onOpenChange={(open) => !open && setEditingPackage(null)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit Package</SheetTitle>
          </SheetHeader>
          {editingPackage && (
            <PackageForm
              mode="edit"
              initialData={editingPackage}
              onSuccess={(updatedPkg) => {
                setPackages((prev) =>
                  prev.map((p) => (p.id === updatedPkg.id ? updatedPkg : p))
                );
                setEditingPackage(null);
              }}
              onCancel={() => setEditingPackage(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        title="Delete Package"
        description="Are you sure you want to delete this package? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
