// Notification system types

export type NotificationType = 
  | 'INFO' 
  | 'SUCCESS' 
  | 'WARNING' 
  | 'ERROR' 
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_UPDATED'
  | 'ASSIGNMENT_COMPLETED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'USER_INVITED'
  | 'USER_ROLE_CHANGED'
  | 'SYSTEM_MAINTENANCE'
  | 'DATA_IMPORT_COMPLETED'
  | 'DATA_EXPORT_COMPLETED'
  | 'AUDIT_LOG_CREATED';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  type: NotificationType;
  enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title_template: string;
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
}

export interface UpdateNotificationRequest {
  status?: NotificationStatus;
  read_at?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (notification: CreateNotificationRequest) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}
