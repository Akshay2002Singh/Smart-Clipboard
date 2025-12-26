import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Platform.OS === 'android' ? Notifications.AndroidNotificationPriority.MAX : undefined,
  }),
});

class NotificationService {
  private notificationIds: Set<string> = new Set();
  private notificationSubscription: Notifications.Subscription | null = null;

  constructor() {
    this.setupNotificationListeners();
    this.registerBackgroundTask();
  }

  // Register background task to handle notifications when app is closed
  private async registerBackgroundTask(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.registerTaskAsync('ALARM_NOTIFICATION_HANDLER');
        console.log('✅ Background notification task registered');
      } catch (error) {
        console.error('⚠️ Error registering background task:', error);
      }
    }
  }

  private setupNotificationListeners(): void {
    // Listen for notifications received (works when app is in foreground)
    this.notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification.request.content.title);
    });

    // Listen for notification responses
    Notifications.addNotificationResponseReceivedListener(async response => {
      console.log('📬 Notification response received:', response.notification.request.content.title);
    });
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default Notifications',
            description: 'Default notification channel',
            importance: Notifications.AndroidImportance.DEFAULT,
            enableVibrate: true,
            showBadge: true,
            sound: 'default',
          });
          console.log('✅ Notification channel created');
        } catch (error) {
          console.error('Error creating notification channel:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.notificationIds.delete(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.notificationIds.clear();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  cleanup(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.remove();
      this.notificationSubscription = null;
    }
  }
}

export const notificationService = new NotificationService();
