import { storage } from '../storage';
import { ClipboardItem } from '../types';
import { generateUUID } from 'src/utils';

import { STORAGE_KEYS } from '../../constants/storage';
import { crashlyticsService } from '../../services/CrashlyticsService';

const CLIPBOARD_STORAGE_KEY = STORAGE_KEYS.CLIPBOARD_ITEMS;
const CUSTOM_CATEGORIES_KEY = STORAGE_KEYS.CUSTOM_CATEGORIES;


class ClipboardRepository {
  private items: ClipboardItem[] | null = null;
  private loaded = false;

  private ensureLoaded(): void {
    if (!this.loaded) {
      try {
        const loadedItems = storage.get<ClipboardItem[]>(CLIPBOARD_STORAGE_KEY, []);
        this.items = loadedItems || [];
        this.loaded = true;
      } catch (error) {
        console.error('Error loading clipboard items from storage:', error);
        crashlyticsService.recordError(error as Error, 'LocalStorageLoadError');
        this.items = [];
        this.loaded = true;
      }
    }
  }

  private saveToStorage(): void {
    if (this.items !== null) {
      storage.set(CLIPBOARD_STORAGE_KEY, this.items);
    }
  }

  getAll(): ClipboardItem[] {
    this.ensureLoaded();
    return [...(this.items || [])];
  }

  getById(id: string): ClipboardItem | undefined {
    this.ensureLoaded();
    return (this.items || []).find(item => item.id === id);
  }

  create(item: Omit<ClipboardItem, 'id' | 'createdAt' | 'updatedAt'>): ClipboardItem {
    this.ensureLoaded();
    if (!this.items) {
      this.items = [];
    }
    const newItem: ClipboardItem = {
      ...item,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items.push(newItem);
    this.saveToStorage();
    return newItem;
  }

  update(id: string, updates: Partial<Omit<ClipboardItem, 'id' | 'createdAt'>>): ClipboardItem | null {
    this.ensureLoaded();
    if (!this.items) return null;
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.items[index] = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.items[index];
  }

  delete(id: string): boolean {
    this.ensureLoaded();
    if (!this.items) return false;
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.items.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  search(query: string): ClipboardItem[] {
    this.ensureLoaded();
    const lowerQuery = query.toLowerCase();
    return (this.items || []).filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.content.toLowerCase().includes(lowerQuery) ||
        item.category?.toLowerCase().includes(lowerQuery)
    );
  }

  filterByCategory(category: string): ClipboardItem[] {
    this.ensureLoaded();
    return (this.items || []).filter(item => item.category === category);
  }

  getCategories(): string[] {
    this.ensureLoaded();
    const categories = new Set<string>();
    (this.items || []).forEach(item => {
      if (item.category) {
        categories.add(item.category);
      }
    });
    return Array.from(categories);
  }

  getCustomCategories(): string[] {
    try {
      const categories = storage.get<string[]>(CUSTOM_CATEGORIES_KEY, []);
      return categories || [];
    } catch (error) {
      console.error('Error loading custom categories:', error);
      crashlyticsService.recordError(error as Error, 'GetCustomCategoriesError');
      return [];
    }
  }

  addCustomCategory(category: string): void {
    try {
      const customCategories = this.getCustomCategories();
      const categoryLower = category.trim().toLowerCase();
      
      // Check if category already exists (case-insensitive)
      if (!customCategories.some(cat => cat.toLowerCase() === categoryLower)) {
        customCategories.push(category.trim());
        storage.set(CUSTOM_CATEGORIES_KEY, customCategories);
      }
    } catch (error) {
      console.error('Error saving custom category:', error);
      crashlyticsService.recordError(error as Error, 'AddCustomCategoryError');
    }
  }

  removeCustomCategory(category: string): void {
    try {
      const customCategories = this.getCustomCategories();
      const categoryLower = category.trim().toLowerCase();
      const filtered = customCategories.filter(
        cat => cat.toLowerCase() !== categoryLower
      );
      storage.set(CUSTOM_CATEGORIES_KEY, filtered);
    } catch (error) {
      console.error('Error removing custom category:', error);
      crashlyticsService.recordError(error as Error, 'RemoveCustomCategoryError');
    }
  }

  /**
   * Replace custom categories with remote data (from Firebase)
   */
  replaceCustomCategories(categories: string[]): void {
    try {
      storage.set(CUSTOM_CATEGORIES_KEY, categories || []);
    } catch (error) {
      console.error('Error replacing custom categories:', error);
      crashlyticsService.recordError(error as Error, 'ReplaceCustomCategoriesError');
    }
  }

  getAllCategories(): string[] {
    const itemCategories = this.getCategories();
    const customCategories = this.getCustomCategories();
    const allCategories = new Set([...itemCategories, ...customCategories]);
    return Array.from(allCategories).sort();
  }

  toggleFavorite(id: string): ClipboardItem | null {
    const item = this.getById(id);
    if (!item) return null;
    return this.update(id, { favorite: !item.favorite });
  }

  getFavorites(): ClipboardItem[] {
    this.ensureLoaded();
    return (this.items || []).filter(item => item.favorite);
  }

  /**
   * Replace all local data with remote data (Firebase is source of truth)
   * Used when fetching from Firebase on app open
   */
  replaceWithRemote(items: ClipboardItem[]): void {
    // Replace all items with Firebase data (Firebase is source of truth for multi-device sync)
    this.items = items;
    this.loaded = true; // Mark as loaded with fresh data
    this.saveToStorage();
  }

  /**
   * Save an item directly (used after Firebase write)
   * This bypasses the create/update logic and directly sets the item
   */
  saveItem(item: ClipboardItem): void {
    this.ensureLoaded();
    if (!this.items) {
      this.items = [];
    }
    const index = this.items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      this.items[index] = item;
    } else {
      this.items.push(item);
    }
    this.saveToStorage();
  }

  /**
   * Clear all local clipboard data
   * Used when user logs out
   */
  clearAll(): void {
    this.items = [];
    this.loaded = true; // Mark as loaded (empty) to avoid re-reading storage
    storage.remove(CLIPBOARD_STORAGE_KEY);
    storage.remove(CUSTOM_CATEGORIES_KEY);
  }
}

export const clipboardRepository = new ClipboardRepository();

