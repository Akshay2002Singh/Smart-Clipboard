import firestore, { Timestamp } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { ClipboardItem } from '@storage/types';
import {
  clipboardRepository,
} from '@storage/repositories';
import { isNetworkAvailable } from '../utils/network';
import { generateUUID } from '../utils/uuid';
import { crashlyticsService } from './CrashlyticsService';

import { encryptionService } from '../utils/encryption';

class FirebaseSyncService {
  private initialized: boolean = false;
  private isSyncing: boolean = false;

  async initialize(): Promise<boolean> {
    try {
      if (this.initialized) {
        return true;
      }

      // React Native Firebase automatically initializes from google-services.json
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      crashlyticsService.recordError(error as Error, 'FirebaseInitError');
      return false;
    }
  }

  private getUserId(): string | null {
    try {
      return auth(getApp()).currentUser?.uid || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Pull all data from Firebase on app open (if logged in)
   * This replaces local data with Firebase data (Firebase is source of truth)
   * Falls back to local data if Firebase fetch fails
   */
  async pullFromFirebase(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    const userId = this.getUserId();
    if (!userId) {
      console.log('No user logged in. Skipping pull from Firebase.');
      return;
    }

    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      console.log('No internet connection. Skipping pull from Firebase.');
      throw new Error('No internet connection');
    }

    this.isSyncing = true;
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Firebase not initialized');
      }

      console.log('Fetching data from Firebase (source of truth)...');
      crashlyticsService.log('Starting pullFromFirebase');
      const clipboardRef = firestore(getApp()).collection(`users/${userId}/clipboard`);

      // Pull remote changes - Firebase is source of truth
      const snapshot = await clipboardRef.get();
      const remoteItems: ClipboardItem[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const decryptedData: any = { ...data };
        
        // Decrypt sensitive fields
        try {
          if (data.content) decryptedData.content = encryptionService.decrypt(data.content);
          if (data.title) decryptedData.title = encryptionService.decrypt(data.title);
        } catch (e) {
          console.error('Failed to decrypt item:', data.id, e);
          // Keep encrypted value or handle as needed
        }
        
        remoteItems.push({
          ...decryptedData,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as ClipboardItem);
      }

      // Replace local data with Firebase data (Firebase is source of truth)
      // This ensures multi-device sync works correctly
      clipboardRepository.replaceWithRemote(remoteItems);
      console.log(`Fetched ${remoteItems.length} items from Firebase`);

      // Pull custom categories from Firebase
      await this.pullCustomCategories();
    } catch (error: any) {
      console.error('Error pulling from Firebase:', error);
      crashlyticsService.recordError(error, 'FirebasePullError');
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pull custom categories from Firebase
   */
  async pullCustomCategories(): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      return;
    }

    try {
      const userDocRef = firestore(getApp()).doc(`users/${userId}`);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const customCategories = data?.customCategories || [];
        clipboardRepository.replaceCustomCategories(customCategories);
        console.log(`Fetched ${customCategories.length} custom categories from Firebase`);
      }
    } catch (error) {
      console.error('Error pulling custom categories from Firebase:', error);
      crashlyticsService.recordError(error as Error, 'PullCategoriesError');
    }
  }

  /**
   * Push custom categories to Firebase
   */
  async pushCustomCategories(categories: string[]): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      throw new Error('No internet connection');
    }

    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Firebase not initialized');
      }

      const userDocRef = firestore(getApp()).doc(`users/${userId}`);
      // Use arrayUnion to safely add new categories without overwriting existing ones
      // This is crucial for the "Login -> Push" flow to merge local categories with remote ones
      await userDocRef.set(
        { customCategories: firestore.FieldValue.arrayUnion(...categories) },
        { merge: true }
      );
      console.log('✅ Pushed custom categories to Firebase');
    } catch (error) {
      console.error('❌ Error pushing custom categories to Firebase:', error);
      crashlyticsService.recordError(error as Error, 'PushCategoriesError');
      throw error;
    }
  }

  /**
   * Delete a single custom category from Firebase
   */
  async deleteCustomCategory(category: string): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      throw new Error('No internet connection');
    }

    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Firebase not initialized');
      }

      const userDocRef = firestore(getApp()).doc(`users/${userId}`);

      // arrayRemove is SAFE even if:
      // - doc does not exist
      // - category does not exist
      await userDocRef.set(
        {
          customCategories: firestore.FieldValue.arrayRemove(category),
        },
        { merge: true }
      );

      // Update local storage after successful Firebase update
      clipboardRepository.removeCustomCategory(category);

      console.log('✅ Deleted custom category:', category);
    } catch (error) {
      console.error('❌ Error deleting custom category:', error);
      crashlyticsService.recordError(error as Error, 'DeleteCustomCategoryError');
      throw error;
    }
  }


  /**
   * Delete all user data from Firebase (items and custom categories)
   */
  async deleteAllUserData(): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      throw new Error('No internet connection');
    }

    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Firebase not initialized');
      }

      const firestoreInstance = firestore(getApp());
      // Delete all clipboard items
      const clipboardRef = firestoreInstance.collection(`users/${userId}/clipboard`);
      const snapshot = await clipboardRef.get();
      if (!snapshot.empty) {
        const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
      }

      /** 2️⃣ Delete or reset user document safely */
      const userDocRef = firestoreInstance.doc(`users/${userId}`);
      const userDoc = await userDocRef.get();

      if (userDoc.exists()) {
        // Option A: Reset fields
        await userDocRef.set(
          { customCategories: [] },
          { merge: true }
        );
      }

      // If doc does not exist → do nothing (this is expected)
      console.log('✅ Deleted all user data from Firebase');
    } catch (error) {
      console.error('❌ Error deleting all user data from Firebase:', error);
      crashlyticsService.recordError(error as Error, 'DeleteUserDataError');
      throw error;
    }
  }

  /**
   * Helper function to remove undefined values from an object
   * Firestore doesn't accept undefined values
   */
  private removeUndefinedValues(obj: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Push a single item to Firebase FIRST (Firebase is source of truth)
   * Then save to local storage after successful Firebase write
   * Returns the saved item if successful, null if failed
   */
  async pushToFirebase(item: ClipboardItem): Promise<ClipboardItem | null> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      throw new Error('No internet connection');
    }

    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Firebase not initialized');
      }

      const clipboardRef = firestore(getApp()).collection(`users/${userId}/clipboard`);
      
      // Prepare data for Firestore - use current timestamp for updatedAt
      const now = new Date();
      
      const firestoreData = this.removeUndefinedValues({
        id: item.id,
        title: encryptionService.encrypt(item.title), // ENCRYPT
        content: encryptionService.encrypt(item.content), // ENCRYPT
        category: item.category,
        favorite: item.favorite ?? false,
        isTemplate: item.isTemplate ?? false,
        updatedAt: Timestamp.fromDate(now),
        createdAt: Timestamp.fromDate(new Date(item.createdAt || now)),
      });

      // Write to Firebase FIRST (Firebase is source of truth)
      await clipboardRef.doc(item.id).set(firestoreData);
      console.log('✅ Pushed item to Firebase:', item.id);

      // After successful Firebase write, save to local storage
      const savedItem: ClipboardItem = {
        ...item,
        updatedAt: now.toISOString(),
        createdAt: item.createdAt || now.toISOString(),
      };

      // Save directly to local storage (Firebase is source of truth)
      clipboardRepository.saveItem(savedItem);

      return savedItem;
    } catch (error) {
      console.error('❌ Error pushing to Firebase:', error);
      crashlyticsService.recordError(error as Error, 'FirebasePushError');
      throw error;
    }
  }

  /**
   * Delete item from Firebase FIRST, then delete from local storage
   * Firebase is source of truth
   */
  async deleteFromFirebase(itemId: string): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      throw new Error('No internet connection');
    }

    try {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Firebase not initialized');
      }

      // Delete from Firebase FIRST
      const clipboardRef = firestore(getApp()).collection(`users/${userId}/clipboard`);
      await clipboardRef.doc(itemId).delete();
      console.log('✅ Deleted item from Firebase:', itemId);

      // After successful Firebase delete, delete from local storage
      clipboardRepository.delete(itemId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting from Firebase:', error);
      crashlyticsService.recordError(error as Error, 'FirebaseDeleteError');
      throw error;
    }
  }

  /**
   * Create a new item - writes to Firebase first, then saves locally
   */
  async createItem(item: Omit<ClipboardItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClipboardItem> {
    // Generate ID locally first
    const newItem: ClipboardItem = {
      ...item,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Write to Firebase first, then save locally
    return await this.pushToFirebase(newItem) as ClipboardItem;
  }

  /**
   * Update an existing item - writes to Firebase first, then updates locally
   */
  async updateItem(id: string, updates: Partial<Omit<ClipboardItem, 'id' | 'createdAt'>>): Promise<ClipboardItem | null> {
    const existingItem = clipboardRepository.getById(id);
    if (!existingItem) {
      throw new Error('Item not found');
    }

    const updatedItem: ClipboardItem = {
      ...existingItem,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Important: We cannot just call pushToFirebase because pushToFirebase expects a full item
    // and re-encrypts everything. That is actually fine since we constructed the full `updatedItem` above.
    // However, if we wanted to support partial field updates strictly, we'd need more logic.
    // Re-using pushToFirebase is safest and easiest here.
    return await this.pushToFirebase(updatedItem);
  }
}

export const firebaseSyncService = new FirebaseSyncService();

