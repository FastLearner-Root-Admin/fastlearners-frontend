"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Trophy,
  Unlock,
  Upload,
} from "lucide-react";

import { showApiToast } from "@/lib/utils/api-toast";
import {
  adminArchiveCompetition,
  adminCloseRegistration,
  adminDeleteCompetition,
  adminGetCompetitions,
  adminOpenRegistration,
  adminPublishCompetition,
} from "@/lib/api/superadmin-quiz";
import { AdminQuizCompetition, PaginationMeta } from "@/lib/types/quiz-competition";
import { getCompetitionStatusBadge } from "@/lib/utils/quiz-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuizCompetitionForm } from "@/components/superadmin/quiz-competition-form";

export default function SuperadminQuizzesPage() {
  const [competitions, setCompetitions] = useState<AdminQuizCompetition[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] =
    useState<AdminQuizCompetition | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  async function fetchCompetitions(page = 1) {
    setLoading(true);
    const res = await adminGetCompetitions(page);
    if (res.success && res.content) {
      setCompetitions(res.content.quiz_competition || []);
      setMeta(res.content.meta || null);
    } else if (res.code !== 200) {
      showApiToast(res.type ?? "error", res.message || "Failed to fetch competitions");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCompetitions();
  }, []);

  async function handleAction(
    id: number,
    action: (id: number) => Promise<any>,
    successMessage: string,
  ) {
    setActioningId(id);
    const res = await action(id);
    if (res.success) {
      showApiToast(res.type ?? "success", res.message || successMessage);
      fetchCompetitions(meta?.current_page || 1);
    } else {
      showApiToast(res.type ?? "error", res.message || "Action failed");
    }
    setActioningId(null);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await adminDeleteCompetition(deletingId);
    if (res.success) {
      setCompetitions((prev) => prev.filter((c) => c.id !== deletingId));
      showApiToast(res.type ?? "success", res.message || "Competition deleted");
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to delete competition");
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Trophy className="size-6 text-primary" />
            Quiz Competitions
          </h2>
          <p className="text-muted-foreground">
            Manage FLNQC competitions, registration windows, and lifecycle.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/superadmin/quizzes/reference">
              <Settings className="mr-2 size-4" />
              Reference Data
            </Link>
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Create Competition
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Competition Date</TableHead>
              <TableHead>Registration Window</TableHead>
              <TableHead>Contestants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : competitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Card className="mx-4 mt-4 border-2 border-dashed bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <Trophy className="mb-4 size-10 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No quiz competitions found
                      </p>
                    </CardContent>
                  </Card>
                </TableCell>
              </TableRow>
            ) : (
              competitions.map((competition) => (
                <TableRow key={competition.id}>
                  <TableCell className="font-medium">{competition.title}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {competition.competition_code}
                  </TableCell>
                  <TableCell>{competition.competition_date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {competition.registration_start_date} &ndash;{" "}
                    {competition.registration_end_date}
                  </TableCell>
                  <TableCell>
                    {competition.registered_contestants} / {competition.maximum_contestants}
                  </TableCell>
                  <TableCell>{getCompetitionStatusBadge(competition.status)}</TableCell>
                  <TableCell>
                    <Badge variant={competition.is_active ? "default" : "secondary"}>
                      {competition.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          disabled={actioningId === competition.id}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCompetition(competition)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(
                              competition.id,
                              adminOpenRegistration,
                              "Registration opened",
                            )
                          }
                        >
                          <Unlock className="mr-2 size-4" />
                          Open Registration
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(
                              competition.id,
                              adminCloseRegistration,
                              "Registration closed",
                            )
                          }
                        >
                          <Lock className="mr-2 size-4" />
                          Close Registration
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(
                              competition.id,
                              adminPublishCompetition,
                              "Competition published",
                            )
                          }
                        >
                          <Upload className="mr-2 size-4" />
                          Publish
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(
                              competition.id,
                              adminArchiveCompetition,
                              "Competition archived",
                            )
                          }
                        >
                          <Archive className="mr-2 size-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingId(competition.id)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            onClick={() => fetchCompetitions(meta.current_page - 1)}
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
            onClick={() => fetchCompetitions(meta.current_page + 1)}
            disabled={meta.current_page === meta.last_page}
          >
            Next
          </Button>
        </div>
      )}

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Create Quiz Competition</SheetTitle>
          </SheetHeader>
          <QuizCompetitionForm
            mode="create"
            onSuccess={() => {
              setIsCreateOpen(false);
              fetchCompetitions(meta?.current_page || 1);
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingCompetition}
        onOpenChange={(open) => !open && setEditingCompetition(null)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit Quiz Competition</SheetTitle>
          </SheetHeader>
          {editingCompetition && (
            <QuizCompetitionForm
              mode="edit"
              initialData={editingCompetition}
              onSuccess={() => {
                setEditingCompetition(null);
                fetchCompetitions(meta?.current_page || 1);
              }}
              onCancel={() => setEditingCompetition(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        title="Delete Quiz Competition"
        description="Are you sure you want to delete this competition? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
