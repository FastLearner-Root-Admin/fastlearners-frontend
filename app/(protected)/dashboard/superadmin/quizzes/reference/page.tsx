"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import Link from "next/link";

import { showApiToast } from "@/lib/utils/api-toast";
import {
  adminCreateCompetitionStatus,
  adminCreateLga,
  adminCreateState,
  adminDeleteCompetitionStatus,
  adminDeleteLga,
  adminDeleteState,
  adminGetCompetitionStatuses,
  adminGetLgasByState,
  adminGetStates,
  adminUpdateCompetitionStatus,
  adminUpdateLga,
  adminUpdateState,
} from "@/lib/api/superadmin-quiz";
import {
  AdminQuizLga,
  AdminQuizState,
  QuizCompetitionStatusOption,
} from "@/lib/types/quiz-competition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---------- Competition Statuses ----------

function CompetitionStatusesTab() {
  const [items, setItems] = useState<QuizCompetitionStatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogItem, setDialogItem] = useState<QuizCompetitionStatusOption | "new" | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchItems() {
    setLoading(true);
    const res = await adminGetCompetitionStatuses();
    if (res.success && res.content?.competition_statuses) {
      setItems(res.content.competition_statuses);
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to fetch statuses");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  function openDialog(item: QuizCompetitionStatusOption | "new") {
    setName(item === "new" ? "" : item.name);
    setDialogItem(item);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSubmitting(true);
    const res =
      dialogItem === "new"
        ? await adminCreateCompetitionStatus(name)
        : await adminUpdateCompetitionStatus(dialogItem!.id, name);
    if (res.success) {
      showApiToast(res.type ?? "success", res.message || "Saved successfully");
      setDialogItem(null);
      fetchItems();
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to save");
    }
    setIsSubmitting(false);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await adminDeleteCompetitionStatus(deletingId);
    if (res.success) {
      showApiToast(res.type ?? "success", res.message || "Deleted");
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to delete");
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openDialog("new")} className="gap-2">
          <Plus className="size-4" />
          Add Status
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No competition statuses found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(item.id)}
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

      <Dialog open={!!dialogItem} onOpenChange={(open) => !open && setDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogItem === "new" ? "Add Competition Status" : "Edit Competition Status"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="status-name">Name</Label>
            <Input
              id="status-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Processing"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        title="Delete Competition Status"
        description="Are you sure you want to delete this status? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------- States ----------

function StatesTab({ onStatesChanged }: { onStatesChanged?: () => void }) {
  const [items, setItems] = useState<AdminQuizState[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogItem, setDialogItem] = useState<AdminQuizState | "new" | null>(null);
  const [form, setForm] = useState({ name: "", code: "", zone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchItems() {
    setLoading(true);
    const res = await adminGetStates();
    if (res.success && res.content?.states) {
      setItems(res.content.states);
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to fetch states");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  function openDialog(item: AdminQuizState | "new") {
    setForm(
      item === "new"
        ? { name: "", code: "", zone: "" }
        : { name: item.name, code: item.code, zone: item.zone || "" },
    );
    setDialogItem(item);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.code.trim() || !form.zone.trim()) return;
    setIsSubmitting(true);
    const res =
      dialogItem === "new"
        ? await adminCreateState(form)
        : await adminUpdateState(dialogItem!.id, form);
    if (res.success) {
      showApiToast(res.type ?? "success", res.message || "Saved successfully");
      setDialogItem(null);
      fetchItems();
      onStatesChanged?.();
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to save");
    }
    setIsSubmitting(false);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await adminDeleteState(deletingId);
    if (res.success) {
      showApiToast(res.type ?? "success", res.message || "Deleted");
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
      onStatesChanged?.();
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to delete");
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openDialog("new")} className="gap-2">
          <Plus className="size-4" />
          Add State
        </Button>
      </div>
      <div className="max-h-[28rem] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No states found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.zone}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(item.id)}
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

      <Dialog open={!!dialogItem} onOpenChange={(open) => !open && setDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogItem === "new" ? "Add State" : "Edit State"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="state-name">Name</Label>
              <Input
                id="state-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Akwa Ibom"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state-code">Code</Label>
                <Input
                  id="state-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. AK"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state-zone">Zone</Label>
                <Input
                  id="state-zone"
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  placeholder="e.g. South South"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        title="Delete State"
        description="Are you sure you want to delete this state? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------- LGAs ----------

function LgasTab() {
  const [states, setStates] = useState<AdminQuizState[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [items, setItems] = useState<AdminQuizLga[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogItem, setDialogItem] = useState<AdminQuizLga | "new" | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    adminGetStates().then((res) => {
      if (res.success && res.content?.states) {
        setStates(res.content.states);
        if (res.content.states.length > 0) {
          setSelectedStateId(String(res.content.states[0].id));
        }
      }
    });
  }, []);

  async function fetchLgas(stateId: string) {
    if (!stateId) return;
    setLoading(true);
    const res = await adminGetLgasByState(Number(stateId));
    if (res.success && res.content?.lgas) {
      setItems(res.content.lgas);
    } else if (res.code !== 200) {
      showApiToast(res.type ?? "error", res.message || "Failed to fetch LGAs");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLgas(selectedStateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStateId]);

  function openDialog(item: AdminQuizLga | "new") {
    setForm(item === "new" ? { name: "", code: "" } : { name: item.name, code: item.code });
    setDialogItem(item);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.code.trim() || !selectedStateId) return;
    setIsSubmitting(true);
    const payload = { name: form.name, code: form.code, state_id: Number(selectedStateId) };
    const res =
      dialogItem === "new"
        ? await adminCreateLga(payload)
        : await adminUpdateLga(dialogItem!.id, payload);
    if (res.success) {
      showApiToast(res.type ?? "success", res.message || "Saved successfully");
      setDialogItem(null);
      fetchLgas(selectedStateId);
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to save");
    }
    setIsSubmitting(false);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await adminDeleteLga(deletingId);
    if (res.success) {
      showApiToast(res.type ?? "success", res.message || "Deleted");
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
    } else {
      showApiToast(res.type ?? "error", res.message || "Failed to delete");
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-xs space-y-2">
          <Label>State</Label>
          <Select value={selectedStateId} onValueChange={setSelectedStateId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.id} value={String(state.id)}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={() => openDialog("new")}
          disabled={!selectedStateId}
          className="gap-2"
        >
          <Plus className="size-4" />
          Add LGA
        </Button>
      </div>

      <div className="max-h-[28rem] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No LGAs found for this state
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(item.id)}
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

      <Dialog open={!!dialogItem} onOpenChange={(open) => !open && setDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogItem === "new" ? "Add LGA" : "Edit LGA"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lga-name">Name</Label>
              <Input
                id="lga-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Uyo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lga-code">Code</Label>
              <Input
                id="lga-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. UYO"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        title="Delete LGA"
        description="Are you sure you want to delete this LGA? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------- Page ----------

export default function QuizReferenceDataPage() {
  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/superadmin/quizzes">
            <ArrowLeft className="mr-2 size-4" />
            Back to Competitions
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Quiz Reference Data</h2>
        <p className="text-muted-foreground">
          Manage competition statuses, states, and local government areas used across FLNQC.
        </p>
      </div>

      <Tabs defaultValue="statuses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statuses" className="gap-2">
            <Tag className="size-4" />
            Competition Statuses
          </TabsTrigger>
          <TabsTrigger value="states" className="gap-2">
            <MapPin className="size-4" />
            States
          </TabsTrigger>
          <TabsTrigger value="lgas" className="gap-2">
            <MapPin className="size-4" />
            LGAs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="statuses">
          <CompetitionStatusesTab />
        </TabsContent>
        <TabsContent value="states">
          <StatesTab />
        </TabsContent>
        <TabsContent value="lgas">
          <LgasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
