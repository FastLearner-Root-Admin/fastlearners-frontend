"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Inbox } from "lucide-react";

import {
  getNotifications,
  getUnreadNotifications,
  markAllNotificationsAsRead,
} from "@/lib/api/notifications";
import { UserNotification } from "@/lib/types/notification";
import { showApiToast } from "@/lib/utils/api-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsForm() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const [listRes, unreadRes] = await Promise.all([
      getNotifications(1),
      getUnreadNotifications(1),
    ]);
    setNotifications(
      listRes.success && listRes.content
        ? listRes.content.notifications.slice(0, 5)
        : [],
    );
    setUnreadCount(
      unreadRes.success && unreadRes.content
        ? (unreadRes.content.meta?.total ??
            unreadRes.content.notifications.length)
        : 0,
    );
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const res = await markAllNotificationsAsRead();
    if (res.success) {
      showApiToast("success", res.message || "All notifications marked as read.");
      await load();
    } else {
      showApiToast(
        res.type ?? "error",
        res.message || "Failed to mark notifications as read.",
      );
    }
    setMarkingAll(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Recent alerts and updates sent to your account.
          </CardDescription>
        </div>
        {unreadCount > 0 && (
          <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">
            {unreadCount} unread
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
            <Inbox className="size-8" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              <CheckCheck className="mr-2 size-4" />
              {markingAll ? "Marking..." : "Mark all as read"}
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/dashboard/notifications">View All</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
