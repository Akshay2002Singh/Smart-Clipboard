import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
  /**
   * Log a custom event with optional parameters.
   */
  async logEvent(name: string, params?: { [key: string]: any }): Promise<void> {
    try {
      await analytics().logEvent(name, params);
      console.log(`📊 Analytics Event: ${name}`, params || '');
    } catch (error) {
      console.error(`Error logging analytics event ${name}:`, error);
    }
  }

  /**
   * Sets the user ID property.
   */
  async setUserId(userId: string | null): Promise<void> {
    try {
      await analytics().setUserId(userId);
    } catch (error) {
      console.error('Error setting analytics user ID:', error);
    }
  }

  /**
   * Sets a user property to a specific value.
   */
  async setUserProperty(name: string, value: string | null): Promise<void> {
    try {
      await analytics().setUserProperty(name, value);
    } catch (error) {
      console.error(`Error setting analytics user property ${name}:`, error);
    }
  }

  /**
   * Logs a screen view.
   */
  async logScreenView(screenName: string, screenClass: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass,
      });
      console.log(`📊 Screen View: ${screenName}`);
    } catch (error) {
      console.error(`Error logging screen view ${screenName}:`, error);
    }
  }

  // Predefined Events Helpers

  async logLogin(method: 'google' | 'guest'): Promise<void> {
    await this.logEvent('login', { method });
  }

  async logSignUp(method: 'google'): Promise<void> {
    await this.logEvent('sign_up', { method });
  }

  async logSignOut(): Promise<void> {
    await this.logEvent('sign_out');
  }

  async logCreateItem(type: 'clipboard' | 'template', category?: string): Promise<void> {
    await this.logEvent('create_item', {
      type,
      category: category || 'uncategorized',
    });
  }

  async logDeleteItem(type: 'clipboard' | 'template'): Promise<void> {
    await this.logEvent('delete_item', { type });
  }

  async logUpdateItem(type: 'clipboard' | 'template'): Promise<void> {
      await this.logEvent('update_item', { type });
  }

  async logSearch(query: string): Promise<void> {
    await this.logEvent('search', { search_term: query });
  }

  async logShare(contentType: string, itemId: string): Promise<void> {
      await this.logEvent('share', { content_type: contentType, item_id: itemId });
  }

  async logCopy(type: 'clipboard' | 'template'): Promise<void> {
      await this.logEvent('copy_to_clipboard', { type });
  }
}

export const analyticsService = new AnalyticsService();
