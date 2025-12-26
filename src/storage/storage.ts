import { createMMKV, MMKV } from 'react-native-mmkv';
import { MMKV_ENCRYPTION_KEY } from '@env';

class Storage {
  private _storage: MMKV | null = null;

  private getStorage(): MMKV {
    if (!this._storage) {
      try {
        this._storage = createMMKV({
          id: 'smart-clipboard-storage',
          encryptionKey: MMKV_ENCRYPTION_KEY,
        });
      } catch (error) {
        console.error('Error initializing MMKV storage:', error);
        // If initialization fails, we'll retry on next access
        throw error;
      }
    }
    if (!this._storage) {
      throw new Error('MMKV storage not initialized');
    }
    return this._storage;
  }

  set(key: string, value: any): void {
    try {
      const stringValue = JSON.stringify(value);
      this.getStorage().set(key, stringValue);
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
      // Silently fail - storage might not be ready yet
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const value = this.getStorage().getString(key);
      if (value === undefined) {
        return defaultValue;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return defaultValue;
    }
  }

  remove(key: string): void {
    try {
      this.getStorage().remove(key);
    } catch (error) {
      console.error(`Error removing key ${key}:`, error);
    }
  }

  clear(): void {
    try {
      this.getStorage().clearAll();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  contains(key: string): boolean {
    try {
      return this.getStorage().contains(key);
    } catch (error) {
      console.error(`Error checking key ${key}:`, error);
      return false;
    }
  }
}

// Create instance lazily - only when first method is called
let storageInstance: Storage | null = null;

function getStorageInstance(): Storage {
  if (!storageInstance) {
    storageInstance = new Storage();
  }
  return storageInstance;
}

export const storage = {
  set: (key: string, value: any) => getStorageInstance().set(key, value),
  get: <T>(key: string, defaultValue?: T) => getStorageInstance().get<T>(key, defaultValue),
  remove: (key: string) => getStorageInstance().remove(key),
  delete: (key: string) => getStorageInstance().remove(key),
  clear: () => getStorageInstance().clear(),
  contains: (key: string) => getStorageInstance().contains(key),
};

