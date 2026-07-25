"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, MailOpen, Trash2 } from "lucide-react";

import {
  deleteNotification,
  getNotifications,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import {
  NotificationPagination,
  UserNotification,
} from "@/lib/types/notification";
import { cn } from "@/lib/utils";
import { showApiToast } from "@/lib/utils/api-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type NotificationView = "all" | "unread";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [pagination, setPagination] = useState<NotificationPagination>({});
  const [view, setView] = useState<NotificationView>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const response =
      view === "unread"
        ? await getUnreadNotifications(page)
        : await getNotifications(page);

    if (response.success && response.content) {
      setNotifications(response.content.notifications || []);
      setPagination({
        links: response.content.links,
        meta: response.content.meta,
      });
    } else {
      showApiToast(
        response.type ?? "error",
        response.message || "Failed to load notifications",
      );
    }
    setLoading(false);
  }, [page, view]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkAsRead(notification: UserNotification) {
    if (notification.read) return;

    setBusyId(notification.id);
    const response = await markNotificationAsRead(notification.id);
    if (response.success) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, read: true, read_at: item.read_at || "now" }
            : item,
        ),
      );
    } else {
      showApiToast(response.type ?? "error", response.message);
    }
    setBusyId(null);
  }

  async function handleMarkAllAsRead() {
    const response = await markAllNotificationsAsRead();
    if (response.success) {
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          read_at: notification.read_at || "now",
        })),
      );
      showApiToast(
        response.type ?? "success",
        response.message || "Notifications marked as read",
      );
    } else {
      showApiToast(response.type ?? "error", response.message);
    }
  }

  async function handleDelete(notificationId: number) {
    setBusyId(notificationId);
    const response = await deleteNotification(notificationId);
    if (response.success) {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );
      showApiToast(
        response.type ?? "success",
        response.message || "Notification deleted",
      );
    } else {
      showApiToast(response.type ?? "error", response.message);
    }
    setBusyId(null);
  }

  const lastPage = pagination.meta?.last_page || 1;

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Review updates and important account messages.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={view === "all" ? "default" : "outline"}
            onClick={() => {
              setView("all");
              setPage(1);
            }}
          >
            All
          </Button>
          <Button
            variant={view === "unread" ? "default" : "outline"}
            onClick={() => {
              setView("unread");
              setPage(1);
            }}
          >
            Unread
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleMarkAllAsRead}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-2 border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <MailOpen className="mb-4 size-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              New messages will appear here when they are available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "border-l-4 transition-colors",
                notification.read
                  ? "border-l-muted bg-background"
                  : "border-l-primary bg-primary/5",
              )}
            >
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Bell className="size-4 shrink-0 text-primary" />
                    <h2 className="font-semibold">{notification.title}</h2>
                    <Badge variant={notification.read ? "secondary" : "default"}>
                      {notification.read ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!notification.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={busyId === notification.id}
                      onClick={() => handleMarkAsRead(notification)}
                    >
                      {busyId === notification.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCheck className="size-4" />
                      )}
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={busyId === notification.id}
                    onClick={() => handleDelete(notification.id)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete notification</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.meta?.current_page || page} of {lastPage}
          </span>
          <Button
            variant="outline"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
