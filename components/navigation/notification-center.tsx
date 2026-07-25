"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useState } from "react";
import { Bell, Check, Loader2, Trash2, X } from "lucide-react";

import {
  deleteNotification,
  getBellNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notifications";
import { UserNotification } from "@/lib/types/notification";
import { cn } from "@/lib/utils";
import { showApiToast } from "@/lib/utils/api-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const BELL_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async (showError = false) => {
    const response = await getBellNotifications();
    if (response.success && response.content) {
      setNotifications(response.content.notifications || []);
    } else if (showError) {
      showApiToast(
        response.type ?? "error",
        response.message || "Unable to load notifications",
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    const intervalId = window.setInterval(
      () => fetchNotifications(),
      BELL_REFRESH_INTERVAL_MS,
    );

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: number) => {
    startTransition(() => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true, read_at: notification.read_at || "now" }
            : notification,
        ),
      );
    });

    const response = await markNotificationAsRead(notificationId);
    if (!response.success) {
      showApiToast(response.type ?? "error", response.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    startTransition(() => {
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          read_at: notification.read_at || "now",
        })),
      );
    });

    const response = await markAllNotificationsAsRead();
    if (!response.success) {
      showApiToast(response.type ?? "error", response.message);
    }
  }, []);

  const removeNotification = useCallback(async (notificationId: number) => {
    const previousNotifications = notifications;
    startTransition(() => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );
    });

    const response = await deleteNotification(notificationId);
    if (!response.success) {
      setNotifications(previousNotifications);
      showApiToast(response.type ?? "error", response.message);
    }
  }, [notifications]);

  const clearShownNotifications = useCallback(async () => {
    const notificationIds = notifications.map((notification) => notification.id);
    if (notificationIds.length === 0) return;

    const previousNotifications = notifications;
    startTransition(() => {
      setNotifications([]);
    });

    const responses = await Promise.all(
      notificationIds.map((notificationId) => deleteNotification(notificationId)),
    );

    if (responses.some((response) => !response.success)) {
      setNotifications(previousNotifications);
      showApiToast("error", "Some notifications could not be deleted");
    }
  }, [notifications]);

  const getNotificationIcon = (read: boolean) => {
    return read ? (
      <Check className="size-4 text-green-600" />
    ) : (
      <Bell className="size-4 text-primary" />
    );
  };

  const getNotificationColors = (read: boolean) => {
    return read
      ? "border-l-muted bg-background"
      : "border-l-primary bg-primary/5";
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("mobile-touch-target relative size-9", className)}
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-xs sm:-right-2 sm:-top-2"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[calc(100vw-2rem)] sm:w-80"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Bell className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[250px] sm:h-[300px]">
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "responsive-padding group relative cursor-pointer border-l-2 text-left text-sm transition-colors hover:bg-muted/50",
                      getNotificationColors(notification.read),
                      !notification.read && "font-medium",
                    )}
                    onClick={() =>
                      !notification.read && markAsRead(notification.id)
                    }
                  >
                    <div className="flex items-start space-x-2">
                      {getNotificationIcon(notification.read)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none sm:text-base">
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 opacity-100 hover:bg-background/50 sm:size-6 sm:opacity-0 sm:group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="size-3" />
                            <span className="sr-only">Remove notification</span>
                          </Button>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.created_at}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="size-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between gap-2 p-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/notifications">View all</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={clearShownNotifications}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Clear shown
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
