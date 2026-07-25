"use client";

import { useEffect, useState } from "react";
import { Bell, Pencil, Plus, Trash2 } from "lucide-react";

import {
  adminDeleteNotification,
  adminGetNotificationAudiences,
  adminGetNotifications,
  adminGetNotificationTypes,
} from "@/lib/api/notifications";
import {
  AdminNotification,
  NotificationAudience,
  NotificationType,
} from "@/lib/types/notification";
import { showApiToast } from "@/lib/utils/api-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
import { NotificationForm } from "@/components/superadmin/notification-form";

function formatValue(value?: string | null) {
  return value ? value.replace(/[-_]/g, " ") : "N/A";
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function SuperadminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [audiences, setAudiences] = useState<NotificationAudience[]>([]);
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotification, setEditingNotification] =
    useState<AdminNotification | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, []);

  async function fetchPageData() {
    setLoading(true);
    const [notificationsResponse, audiencesResponse, typesResponse] =
      await Promise.all([
        adminGetNotifications(),
        adminGetNotificationAudiences(),
        adminGetNotificationTypes(),
      ]);

    if (notificationsResponse.success && notificationsResponse.content) {
      setNotifications(notificationsResponse.content.notifications || []);
    } else {
      showApiToast(
        notificationsResponse.type ?? "error",
        notificationsResponse.message || "Failed to fetch notifications",
      );
    }

    if (audiencesResponse.success && audiencesResponse.content) {
      setAudiences(audiencesResponse.content.audiences || []);
    } else {
      showApiToast(
        audiencesResponse.type ?? "error",
        audiencesResponse.message || "Failed to fetch audiences",
      );
    }

    if (typesResponse.success && typesResponse.content) {
      setTypes(typesResponse.content.types || []);
    } else {
      showApiToast(
        typesResponse.type ?? "error",
        typesResponse.message || "Failed to fetch notification types",
      );
    }

    setLoading(false);
  }

  async function handleDelete() {
    if (!deletingId) return;

    setIsDeleting(true);
    const response = await adminDeleteNotification(deletingId);
    if (response.success) {
      await fetchPageData();
      showApiToast(
        response.type ?? "success",
        response.message || "Notification deleted",
      );
    } else {
      showApiToast(
        response.type ?? "error",
        response.message || "Failed to delete notification",
      );
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Create and manage system notifications.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create Notification
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Read</TableHead>
              <TableHead>Unread</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 10 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Card className="mx-4 mt-4 border-2 border-dashed bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <Bell className="mb-4 size-10 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No notifications found
                      </p>
                    </CardContent>
                  </Card>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification, index) => (
                <TableRow key={notification.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="max-w-[260px] font-bold">
                    <span className="line-clamp-2">{notification.title}</span>
                  </TableCell>
                  <TableCell className="capitalize">
                    {formatValue(notification.audience)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {formatValue(notification.notification_type)}
                  </TableCell>
                  <TableCell>{notification.recipients_count}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{notification.read_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{notification.unread_count}</Badge>
                  </TableCell>
                  <TableCell>{notification.created_by || "N/A"}</TableCell>
                  <TableCell>{formatDate(notification.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingNotification(notification)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(notification.id)}
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
            <SheetTitle>Create Notification</SheetTitle>
          </SheetHeader>
          <NotificationForm
            mode="create"
            audiences={audiences}
            types={types}
            onSuccess={async () => {
              await fetchPageData();
              setIsCreateOpen(false);
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingNotification}
        onOpenChange={(open) => !open && setEditingNotification(null)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit Notification</SheetTitle>
          </SheetHeader>
          {editingNotification && (
            <NotificationForm
              mode="edit"
              audiences={audiences}
              types={types}
              initialData={editingNotification}
              onSuccess={async () => {
                await fetchPageData();
                setEditingNotification(null);
              }}
              onCancel={() => setEditingNotification(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && !isDeleting && setDeletingId(null)}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
