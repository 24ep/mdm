import { 
  Notification, 
  CreateNotificationRequest, 
  NotificationType, 
  NotificationPriority 
} from '@/types/notifications';

export class NotificationService {
  private static instance: NotificationService;
  private eventSource: EventSource | null = null;
  private listeners: ((notification: Notification) => void)[] = [];

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Create a notification
  async createNotification(notification: CreateNotificationRequest): Promise<Notification> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notification for assignment events
  async createAssignmentNotification(
    userId: string,
    assignmentId: string,
    type: 'ASSIGNMENT_CREATED' | 'ASSIGNMENT_UPDATED' | 'ASSIGNMENT_COMPLETED',
    title: string,
    description: string,
    priority: NotificationPriority = 'MEDIUM'
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type,
      title,
      message: description,
      priority,
      data: { assignment_id: assignmentId },
      action_url: `/assignments/${assignmentId}`,
      action_label: 'View Assignment',
    });
  }

  // Create notification for customer events
  async createCustomerNotification(
    userId: string,
    customerId: string,
    type: 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED',
    customerName: string,
    priority: NotificationPriority = 'MEDIUM'
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type,
      title: type === 'CUSTOMER_CREATED' ? 'New Customer Added' : 'Customer Updated',
      message: `Customer "${customerName}" has been ${type === 'CUSTOMER_CREATED' ? 'added' : 'updated'}`,
      priority,
      data: { customer_id: customerId, customer_name: customerName },
      action_url: `/customers/${customerId}`,
      action_label: 'View Customer',
    });
  }

  // Create notification for user events
  async createUserNotification(
    userId: string,
    type: 'USER_INVITED' | 'USER_ROLE_CHANGED',
    title: string,
    message: string,
    priority: NotificationPriority = 'MEDIUM',
    data?: Record<string, any>
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type,
      title,
      message,
      priority,
      data,
    });
  }

  // Create system notification
  async createSystemNotification(
    userId: string,
    type: 'SYSTEM_MAINTENANCE' | 'INFO' | 'WARNING' | 'ERROR',
    title: string,
    message: string,
    priority: NotificationPriority = 'MEDIUM',
    expiresAt?: Date
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type,
      title,
      message,
      priority,
      expires_at: expiresAt?.toISOString(),
    });
  }

  // Create data import/export notification
  async createDataJobNotification(
    userId: string,
    type: 'DATA_IMPORT_COMPLETED' | 'DATA_EXPORT_COMPLETED',
    jobId: string,
    status: 'SUCCESS' | 'FAILED',
    message: string,
    priority: NotificationPriority = 'MEDIUM'
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type,
      title: `${type === 'DATA_IMPORT_COMPLETED' ? 'Data Import' : 'Data Export'} ${status}`,
      message,
      priority,
      data: { job_id: jobId, status },
      action_url: `/import-export`,
      action_label: 'View Jobs',
    });
  }

  // Create audit log notification
  async createAuditLogNotification(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    userName: string,
    priority: NotificationPriority = 'LOW'
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      type: 'AUDIT_LOG_CREATED',
      title: 'Audit Log Entry',
      message: `${action} performed on ${entityType} by ${userName}`,
      priority,
      data: { action, entity_type: entityType, entity_id: entityId, user_name: userName },
    });
  }

  // Bulk create notifications for multiple users
  async createBulkNotification(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'MEDIUM',
    data?: Record<string, any>
  ): Promise<Notification[]> {
    const promises = userIds.map(userId => 
      this.createNotification({
        user_id: userId,
        type,
        title,
        message,
        priority,
        data,
      })
    );

    return Promise.all(promises);
  }

  // Start real-time notifications (Server-Sent Events)
  startRealTimeNotifications(userId: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`/api/sse/notifications?user_id=${userId}`);
    
    this.eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        this.notifyListeners(notification);
      } catch (error) {
        console.error('Error parsing notification event:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.startRealTimeNotifications(userId);
        }
      }, 5000);
    };
  }

  // Stop real-time notifications
  stopRealTimeNotifications(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Add listener for real-time notifications
  addListener(listener: (notification: Notification) => void): void {
    this.listeners.push(listener);
  }

  // Remove listener
  removeListener(listener: (notification: Notification) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Notify all listeners
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const response = await fetch('/api/notifications/cleanup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup expired notifications');
      }

      const data = await response.json();
      return data.cleanedCount;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    by_type: Record<string, number>;
    by_priority: Record<string, number>;
  }> {
    try {
      const response = await fetch(`/api/notifications/stats?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
