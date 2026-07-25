import { ApiResponse } from "@/lib/types/auth";
import {
  AdminNotification,
  CreateNotificationAudienceData,
  CreateNotificationData,
  CreateNotificationTypeData,
  NotificationAudience,
  NotificationPagination,
  NotificationType,
  UpdateNotificationData,
  UserNotification,
} from "@/lib/types/notification";

function apiError<T>(error: any, message: string): ApiResponse<T> {
  return {
    success: false,
    message: error?.message || message,
    content: null,
    code: 500,
    type: "error",
  };
}

function withJson(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  };
}

function unwrapUserNotificationPage(data: any) {
  const page = data?.content?.notifications;
  const notifications = Array.isArray(page)
    ? page
    : Array.isArray(page?.notifications)
      ? page.notifications
      : Array.isArray(page?.data)
        ? page.data
        : Array.isArray(data?.content?.data)
          ? data.content.data
          : [];

  data.content = {
    notifications,
    links: page?.links || data?.content?.links,
    meta: page?.meta || data?.content?.meta,
  };

  return data;
}

function unwrapBellNotifications(data: any) {
  const notifications = data?.content?.notifications;
  data.content = {
    notifications: Array.isArray(notifications)
      ? notifications
      : Array.isArray(notifications?.notifications)
        ? notifications.notifications
        : Array.isArray(notifications?.data)
          ? notifications.data
          : [],
  };
  return data;
}

function unwrapNotificationAudiences(data: any) {
  const audiences =
    data?.content?.audiences ||
    data?.content?.audience ||
    data?.content?.notification_audiences ||
    [];
  data.content = { audiences: Array.isArray(audiences) ? audiences : [] };
  return data;
}

function unwrapNotificationTypes(data: any) {
  const types =
    data?.content?.types ||
    data?.content?.notification_types ||
    data?.content?.notificationTypes ||
    [];
  data.content = { types: Array.isArray(types) ? types : [] };
  return data;
}

function unwrapAdminNotificationPage(data: any) {
  const source = data?.content?.notifications;
  const notifications = Array.isArray(source)
    ? source
    : Array.isArray(source?.notifications)
      ? source.notifications
      : Array.isArray(source?.data)
        ? source.data
        : Array.isArray(data?.content?.data)
          ? data.content.data
          : [];

  data.content = {
    notifications,
    links: source?.links || data?.content?.links,
    meta: source?.meta || data?.content?.meta,
  };

  return data;
}

export async function getNotifications(
  page = 1,
): Promise<ApiResponse<{ notifications: UserNotification[] } & NotificationPagination>> {
  try {
    const res = await fetch(`/api/proxy/notifications?page=${page}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return unwrapUserNotificationPage(await res.json());
  } catch (error: any) {
    return apiError(error, "Failed to fetch notifications");
  }
}

export async function getBellNotifications(): Promise<
  ApiResponse<{ notifications: UserNotification[] }>
> {
  try {
    const res = await fetch("/api/proxy/notifications/bell-notifications", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return unwrapBellNotifications(await res.json());
  } catch (error: any) {
    return apiError(error, "Failed to fetch bell notifications");
  }
}

export async function getUnreadNotifications(
  page = 1,
): Promise<ApiResponse<{ notifications: UserNotification[] } & NotificationPagination>> {
  try {
    const res = await fetch(`/api/proxy/notifications/unread?page=${page}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return unwrapUserNotificationPage(await res.json());
  } catch (error: any) {
    return apiError(error, "Failed to fetch unread notifications");
  }
}

export async function markNotificationAsRead(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/notifications/${id}/mark-as-read`, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to mark notification as read");
  }
}

export async function markAllNotificationsAsRead(): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/notifications/mark-all-as-read", {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to mark notifications as read");
  }
}

export async function deleteNotification(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/notifications/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to delete notification");
  }
}

export async function adminGetNotifications(): Promise<
  ApiResponse<{ notifications: AdminNotification[] } & NotificationPagination>
> {
  try {
    const res = await fetch("/api/proxy/superadmin/notifications", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return unwrapAdminNotificationPage(await res.json());
  } catch (error: any) {
    return apiError(error, "Failed to fetch admin notifications");
  }
}

export async function adminCreateNotification(
  data: CreateNotificationData,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch("/api/proxy/superadmin/notifications/create", withJson(data));
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to create notification");
  }
}

export async function adminUpdateNotification(
  id: number,
  data: UpdateNotificationData,
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(
      `/api/proxy/superadmin/notifications/${id}/update`,
      withJson(data),
    );
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to update notification");
  }
}

export async function adminDeleteNotification(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/notifications/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to delete notification");
  }
}

export async function adminGetNotificationAudiences(): Promise<
  ApiResponse<{ audiences: NotificationAudience[] }>
> {
  try {
    const res = await fetch("/api/proxy/superadmin/notifications/audience", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return unwrapNotificationAudiences(await res.json());
  } catch (error: any) {
    return apiError(error, "Failed to fetch notification audiences");
  }
}

export async function adminCreateNotificationAudience(
  data: CreateNotificationAudienceData,
): Promise<ApiResponse<NotificationAudience>> {
  try {
    const res = await fetch(
      "/api/proxy/superadmin/notifications/audience/create",
      withJson(data),
    );
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to create notification audience");
  }
}

export async function adminUpdateNotificationAudience(
  id: number,
  data: CreateNotificationAudienceData,
): Promise<ApiResponse<NotificationAudience>> {
  try {
    const res = await fetch(
      `/api/proxy/superadmin/notifications/audience/${id}/update`,
      withJson(data),
    );
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to update notification audience");
  }
}

export async function adminDeleteNotificationAudience(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(
      `/api/proxy/superadmin/notifications/audience/${id}/delete`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: "include",
      },
    );
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to delete notification audience");
  }
}

export async function adminGetNotificationTypes(): Promise<
  ApiResponse<{ types: NotificationType[] }>
> {
  try {
    const res = await fetch("/api/proxy/superadmin/notifications/types", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return unwrapNotificationTypes(await res.json());
  } catch (error: any) {
    return apiError(error, "Failed to fetch notification types");
  }
}

export async function adminCreateNotificationType(
  data: CreateNotificationTypeData,
): Promise<ApiResponse<NotificationType>> {
  try {
    const res = await fetch(
      "/api/proxy/superadmin/notifications/types/create",
      withJson(data),
    );
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to create notification type");
  }
}

export async function adminUpdateNotificationType(
  id: number,
  data: CreateNotificationTypeData,
): Promise<ApiResponse<NotificationType>> {
  try {
    const res = await fetch(
      `/api/proxy/superadmin/notifications/types/${id}/update`,
      withJson(data),
    );
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to update notification type");
  }
}

export async function adminDeleteNotificationType(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`/api/proxy/superadmin/notifications/types/${id}/delete`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    return await res.json();
  } catch (error: any) {
    return apiError(error, "Failed to delete notification type");
  }
}
