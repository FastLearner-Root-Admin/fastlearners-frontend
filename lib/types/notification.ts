export interface UserNotification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  audience: string | null;
  notification_type: string | null;
  recipients_count: number;
  read_count: number;
  unread_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationAudience {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationType {
  id: number;
  name: string;
  slug: string;
  duration: number | string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPagination {
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type_id: number;
  audience: string;
  user_ids?: number[];
}

export interface UpdateNotificationData {
  title: string;
  message: string;
}

export interface CreateNotificationAudienceData {
  name: string;
  description?: string;
}

export interface CreateNotificationTypeData {
  name: string;
  duration: number;
  description?: string;
}
