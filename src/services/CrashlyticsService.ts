import crashlytics from '@react-native-firebase/crashlytics';

class CrashlyticsService {
  /**
   * Log a message that will appear in the next crash report.
   */
  log(message: string): void {
    try {
      crashlytics().log(message);
    } catch (error) {
      console.error('Crashlytics log error:', error);
    }
  }

  /**
   * Record a non-fatal error.
   */
  recordError(error: Error, jsErrorName?: string): void {
    try {
        if (jsErrorName) {
            // Optionally add the name to the error stack or separate it
            // crashlytics handles Error objects best
        }
      crashlytics().recordError(error, jsErrorName);
    } catch (e) {
      console.error('Crashlytics recordError error:', e);
    }
  }

  /**
   * Set a user ID to associate with subsequent crash reports.
   */
  setUserId(userId: string): void {
    try {
      crashlytics().setUserId(userId);
    } catch (error) {
      console.error('Crashlytics setUserId error:', error);
    }
  }

  /**
   * Set a key/value attribute to associate with subsequent crash reports.
   */
  setAttribute(key: string, value: string): void {
    try {
      crashlytics().setAttribute(key, value);
    } catch (error) {
      console.error('Crashlytics setAttribute error:', error);
    }
  }

  /**
   * Set multiple attributes.
   */
  setAttributes(attributes: { [key: string]: string }): void {
    try {
      crashlytics().setAttributes(attributes);
    } catch (error) {
      console.error('Crashlytics setAttributes error:', error);
    }
  }

  /**
   * Enable or disable Crashlytics collection (e.g. based on user consent).
   */
  async setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void> {
    try {
      await crashlytics().setCrashlyticsCollectionEnabled(enabled);
    } catch (error) {
      console.error('Crashlytics setCrashlyticsCollectionEnabled error:', error);
    }
  }
  
  /**
   * Force a crash to test Crashlytics (Do not use in production!)
   */
  testCrash(): void {
      crashlytics().log('Testing crash');
      crashlytics().crash();
  }
}

export const crashlyticsService = new CrashlyticsService();
