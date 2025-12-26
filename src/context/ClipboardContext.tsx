import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ToastAndroid } from 'react-native';
import { ClipboardItem } from '@storage/types';
import { clipboardRepository } from '@storage/repositories';
import * as Clipboard from 'expo-clipboard';
import NetInfo from '@react-native-community/netinfo';
import { firebaseSyncService } from '../services/FirebaseSyncService';
import { crashlyticsService } from '../services/CrashlyticsService';
import { analyticsService } from '../services/AnalyticsService';
import { useAuth } from './AuthContext';
import { storage } from '@storage/storage';
import { APP_LIMITS } from "../constants/limits";

interface ClipboardContextType {
  items: ClipboardItem[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;
  addItem: (item: Omit<ClipboardItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ClipboardItem>;
  updateItem: (id: string, updates: Partial<ClipboardItem>) => Promise<ClipboardItem | null>;
  deleteItem: (id: string) => Promise<boolean>;
  copyToClipboard: (item: ClipboardItem) => Promise<void>;
  searchItems: (query: string) => void;
  filterByCategory: (category: string | null) => void;
  getCategories: () => string[];
  addCustomCategory: (category: string) => Promise<void>;
  toggleFavorite: (id: string) => ClipboardItem | null;
  refresh: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export const useClipboard = (): ClipboardContextType => {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error('useClipboard must be used within ClipboardProvider');
  }
  return context;
};

interface ClipboardProviderProps {
  children: React.ReactNode;
}

export const ClipboardProvider: React.FC<ClipboardProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadItems = useCallback(() => {
    try {
      let allItems = clipboardRepository.getAll();

      if (searchQuery) {
        allItems = clipboardRepository.search(searchQuery);
      } else if (selectedCategory) {
        allItems = clipboardRepository.filterByCategory(selectedCategory);
      }

      setItems(allItems);
    } catch (error: any) {
      console.error('Error loading clipboard items:', error);
      crashlyticsService.recordError(error, 'LoadItemsError');
    }
  }, [searchQuery, selectedCategory]);

  // Initial load
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Sync logic on Auth Change
  useEffect(() => {
    const sync = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        crashlyticsService.log('Starting sync from ClipboardContext');
        try {
          // Check for local data to sync (Guest -> User migration, or simple sync)
          const localItems = clipboardRepository.getAll();
          const localCategories = clipboardRepository.getCustomCategories();

          if (localItems.length > 0 || localCategories.length > 0) {
            console.log('♻️ Found local data, pushing to cloud before pull...');

            const promises: Promise<any>[] = [];

            // 1. Push Custom Categories
            if (localCategories.length > 0) {
              promises.push(
                firebaseSyncService.pushCustomCategories(localCategories)
                  .catch(e => {
                    console.error('Failed to push categories:', e);
                    crashlyticsService.recordError(e, 'PushCategoriesError');
                  })
              );
            }

            // 2. Push Items
            localItems.forEach(item => {
              promises.push(
                firebaseSyncService.pushToFirebase(item)
                  .catch(e => {
                    console.error('Failed to push item:', item.id, e);
                    crashlyticsService.recordError(e, 'PushItemError');
                  })
              );
            });

            await Promise.all(promises);
            console.log('✅ Local data push completed.');
          }

          // 3. Fetch latest from Firebase (Source of Truth) to get old + new
          await firebaseSyncService.pullFromFirebase();

        } catch (error: any) {
          console.warn('Sync failed (likely offline), using local data.', error);
          crashlyticsService.recordError(error, 'SyncError');
        } finally {
          // Always load items (from repo) and stop loading
          loadItems();
          setIsLoading(false);
        }
      } else {
        // User logged out OR Guest mode
        // Just load what's in the repo. 
        // If it was a logout, AuthContext has already cleared the repo, so this loads empty.
        // If it's a guest startup, this loads the local guest data.
        loadItems();
      }
    };
    sync();
  }, [isAuthenticated, loadItems]);

  // Listen for network changes to trigger sync when back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && isAuthenticated) {
        console.log('Network connected, triggering sync...');
        // We don't call sync() directly here because the auth change effect already handles initial sync.
        // This is more for when network drops and comes back while authenticated.
        // The sync() function itself will handle processing pending actions and pulling from Firebase.
        // We can just call it directly.
        const syncOnConnect = async () => {
          if (isAuthenticated) {
            setIsLoading(true);
            try {
              await firebaseSyncService.pullFromFirebase();
              loadItems();
            } catch (error: any) {
              console.error('Sync on connect failed', error);
              crashlyticsService.recordError(error, 'SyncOnConnectError');
            } finally {
              setIsLoading(false);
            }
          }
        };
        syncOnConnect();
      }
    });
    return () => unsubscribe();
  }, [isAuthenticated, loadItems]); // Added loadItems to dependency array

  // App Open Sync (independent of auth change if already logged in)
  // We can just rely on the above effect since it runs on mount if isAuthenticated is true.

  const addItem = useCallback(async (item: Omit<ClipboardItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClipboardItem> => {
    // Check Content Length Limit
    if (item.content.length > APP_LIMITS.MAX_CONTENT_LENGTH) {
      const msg = `Content exceeds limit of ${APP_LIMITS.MAX_CONTENT_LENGTH} characters.`;
      ToastAndroid.show(msg, ToastAndroid.LONG);
      throw new Error(msg);
    }

    // Check Title Length Limit
    if (item.title.length > APP_LIMITS.MAX_TITLE_LENGTH) {
      const msg = `Title exceeds limit of ${APP_LIMITS.MAX_TITLE_LENGTH} characters.`;
      ToastAndroid.show(msg, ToastAndroid.LONG);
      throw new Error(msg);
    }

    // Check Category Length Limit
    if (item.category && item.category.length > APP_LIMITS.MAX_CATEGORY_LENGTH) {
      const msg = `Category exceeds limit of ${APP_LIMITS.MAX_CATEGORY_LENGTH} characters.`;
      ToastAndroid.show(msg, ToastAndroid.LONG);
      throw new Error(msg);
    }

    // Check Item Limits
    const currentItems = clipboardRepository.getAll();
    const isTemplate = item.isTemplate === true;

    if (isTemplate) {
      const templateCount = currentItems.filter(i => i.isTemplate).length;
      if (templateCount >= APP_LIMITS.MAX_TEMPLATE_ITEMS) {
        const msg = `Limit reached: You can only have ${APP_LIMITS.MAX_TEMPLATE_ITEMS} templates.`;
        ToastAndroid.show(msg, ToastAndroid.LONG);
        throw new Error(msg);
      }
    } else {
      const clipboardCount = currentItems.filter(i => !i.isTemplate).length;
      if (clipboardCount >= APP_LIMITS.MAX_CLIPBOARD_ITEMS) {
        const msg = `Limit reached: You can only have ${APP_LIMITS.MAX_CLIPBOARD_ITEMS} clipboards.`;
        ToastAndroid.show(msg, ToastAndroid.LONG);
        throw new Error(msg);
      }
    }

    if (isAuthenticated) {
      try {
        // Write to Firebase FIRST (Firebase is source of truth)
        const savedItem = await firebaseSyncService.createItem(item);
        loadItems();
        analyticsService.logCreateItem(isTemplate ? 'template' : 'clipboard', item.category);
        return savedItem;
      } catch (error: any) {
        console.error('Firebase create failed:', error);
        crashlyticsService.recordError(error, 'AddItemError');
        throw error;
      }
    } else {
      // Not logged in - save locally only
      const newItem = clipboardRepository.create(item);
      loadItems();
      analyticsService.logCreateItem(isTemplate ? 'template' : 'clipboard', item.category);
      return newItem;
    }
  }, [loadItems, isAuthenticated]);

  const updateItem = useCallback(async (id: string, updates: Partial<ClipboardItem>): Promise<ClipboardItem | null> => {
    const existingItem = clipboardRepository.getById(id);
    const itemType = existingItem?.isTemplate ? 'template' : 'clipboard';

    // Check Content Length Limit
    if (updates?.content && updates.content.length > APP_LIMITS.MAX_CONTENT_LENGTH) {
      const msg = `Content exceeds limit of ${APP_LIMITS.MAX_CONTENT_LENGTH} characters.`;
      ToastAndroid.show(msg, ToastAndroid.LONG);
      throw new Error(msg);
    }

    // Check Title Length Limit
    if (updates?.title && updates.title.length > APP_LIMITS.MAX_TITLE_LENGTH) {
      const msg = `Title exceeds limit of ${APP_LIMITS.MAX_TITLE_LENGTH} characters.`;
      ToastAndroid.show(msg, ToastAndroid.LONG);
      throw new Error(msg);
    }

    // Check Category Length Limit
    if (updates?.category && updates.category.length > APP_LIMITS.MAX_CATEGORY_LENGTH) {
      const msg = `Category exceeds limit of ${APP_LIMITS.MAX_CATEGORY_LENGTH} characters.`;
      ToastAndroid.show(msg, ToastAndroid.LONG);
      throw new Error(msg);
    }

    if (isAuthenticated) {
      try {
        const updated = await firebaseSyncService.updateItem(id, updates);
        if (updated) {
          loadItems();
          analyticsService.logUpdateItem(itemType);
        }
        return updated;
      } catch (error: any) {
        console.error('Firebase update failed:', error);
        crashlyticsService.recordError(error, 'UpdateItemError');
        throw error;
      }
    } else {
      const updated = clipboardRepository.update(id, updates);
      if (updated) {
        loadItems();
        analyticsService.logUpdateItem(itemType);
      }
      return updated;
    }
  }, [loadItems, isAuthenticated]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    const existingItem = clipboardRepository.getById(id);
    const itemType = existingItem?.isTemplate ? 'template' : 'clipboard';

    if (isAuthenticated) {
      try {
        const deleted = await firebaseSyncService.deleteFromFirebase(id);
        if (deleted) {
          loadItems();
          analyticsService.logDeleteItem(itemType);
        }
        return deleted;
      } catch (error: any) {
        console.error('Firebase delete failed:', error);
        crashlyticsService.recordError(error, 'DeleteItemError');
        throw error;
      }
    } else {
      const deleted = clipboardRepository.delete(id);
      if (deleted) {
        loadItems();
        analyticsService.logDeleteItem(itemType);
      }
      return deleted;
    }
  }, [loadItems, isAuthenticated]);

  const copyToClipboard = useCallback(async (item: ClipboardItem): Promise<void> => {
    try {
      await Clipboard.setStringAsync(item.content);
      analyticsService.logCopy(item.isTemplate ? 'template' : 'clipboard');
    } catch (error: any) {
      console.error('Error copying to clipboard:', error);
      crashlyticsService.recordError(error, 'ClipboardCopyError');
      throw error;
    }
  }, []);

  const searchItems = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      analyticsService.logSearch(query);
    }
  }, []);

  const filterByCategory = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  const getCategories = useCallback((): string[] => {
    return clipboardRepository.getCategories();
  }, []);

  const addCustomCategory = useCallback(async (category: string): Promise<void> => {
    // Check Category Length Limit
    if (category.length > APP_LIMITS.MAX_CATEGORY_LENGTH) {
      const msg = `Category exceeds limit of ${APP_LIMITS.MAX_CATEGORY_LENGTH} characters.`;
      ToastAndroid.show(msg, ToastAndroid.LONG);
      throw new Error(msg);
    }
    if (isAuthenticated) {
      try {
        const customCategories = clipboardRepository.getCustomCategories();
        await firebaseSyncService.pushCustomCategories(customCategories);
        clipboardRepository.addCustomCategory(category);
      } catch (error: any) {
        console.warn('Sync failed for addCustomCategory', error);
        crashlyticsService.recordError(error, 'AddCategoryError');
        throw error;
      }
    }else {
      clipboardRepository.addCustomCategory(category);
    }
  }, [isAuthenticated]);

  const toggleFavorite = useCallback((id: string): ClipboardItem | null => {
    const updated = clipboardRepository.toggleFavorite(id);
    if (updated) {
      loadItems();
      // Also sync favorite status if online
      if (isAuthenticated) {
        updateItem(id, { favorite: updated.favorite }).catch(console.error);
      }
    }
    return updated;
  }, [loadItems, isAuthenticated, updateItem]);

  const refresh = useCallback(() => {
    loadItems();
    if (isAuthenticated) {
      firebaseSyncService.pullFromFirebase().then(loadItems).catch(console.error);
    }
  }, [loadItems, isAuthenticated]);

  const value: ClipboardContextType = {
    items,
    searchQuery,
    selectedCategory,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    copyToClipboard,
    searchItems,
    filterByCategory,
    getCategories,
    addCustomCategory,
    toggleFavorite,
    refresh,
  };

  return <ClipboardContext.Provider value={value}>{children}</ClipboardContext.Provider>;
};
