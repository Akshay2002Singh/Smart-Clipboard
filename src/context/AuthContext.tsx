import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { googleWebClientId } from '../config/firebase';
import { firebaseSyncService } from '../services/FirebaseSyncService';
import { crashlyticsService } from '../services/CrashlyticsService';
import { analyticsService } from '../services/AnalyticsService';
import { clipboardRepository } from '../storage/repositories';
import { storage } from '../storage/storage';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase + Google Sign-In initialization
  useEffect(() => {
    // Verify Google Web Client ID
    if (!googleWebClientId || googleWebClientId === 'your-google-web-client-id.apps.googleusercontent.com') {
      console.error('⚠️ Google Web Client ID not configured properly:', googleWebClientId);
    } else {
      console.log('Google Web Client ID loaded:', googleWebClientId.substring(0, 10) + '...');

      GoogleSignin.configure({
        webClientId: googleWebClientId,
        offlineAccess: false,
      });
    }

    // Listen to authentication state changes (using modular API)
    const authInstance = auth(getApp());
    const unsubscribe = authInstance.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);

      if (firebaseUser) {
        console.log('User authenticated:', firebaseUser.uid);
        crashlyticsService.setUserId(firebaseUser.uid);
        crashlyticsService.log('User authenticated');
        analyticsService.setUserId(firebaseUser.uid);
      } else {
        console.log('ℹ️ User not authenticated');
        crashlyticsService.log('User not authenticated');
        analyticsService.setUserId(null);
      }
    });

    return unsubscribe;
  }, []);

  // Google Sign-In for Android using native SDK
  const signInWithGoogle = useCallback(async () => {
    try {
      if (!googleWebClientId || googleWebClientId === 'your-google-web-client-id.apps.googleusercontent.com') {
        throw new Error('Google Web Client ID is not configured in .env');
      }

      console.log('Starting Google Sign-In...');

      console.log('Starting Google Sign-In...');

      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      } catch (e) {
        console.warn('Google Play Services check failed', e);
      }

      // Check if device has Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign Out of Google to force account picker and clear state
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // ignore
      }

      // Get user's ID token from Google Sign-In
      const result = await GoogleSignin.signIn();
      console.log(' Google Sign-In successful');

      if (result.type === 'cancelled') {
        throw new Error('Google Sign-In cancelled');
      }

      const idToken = result.data?.idToken;

      if (!idToken) {
        console.log(' Trying getTokens()...');
        const tokens = await GoogleSignin.getTokens();

        if (!tokens.idToken) {
          throw new Error('Google Sign-In did not return an ID token.');
        }

        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(tokens.idToken);
        await auth(getApp()).signInWithCredential(googleCredential);
        console.log(' Firebase authentication successful');
        analyticsService.logLogin('google');
      } else {
        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        await auth(getApp()).signInWithCredential(googleCredential);
        console.log(' Firebase authentication successful');
        analyticsService.logLogin('google');
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      crashlyticsService.recordError(error, 'GoogleSignInError');

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('User cancelled Google Sign-In');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services unavailable');
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in is already in progress.');
      }
      if (error.code === '10') {
        // Developer error handling
        console.error('DEV ERROR: Check SHA1 and WebClientID.');
      }

      // throw error;
      throw new Error('Google Sign-In failed');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear all local data before signing out
      console.log('🧹 Clearing local data on logout...');
      clipboardRepository.clearAll();

      // Also clear skip_login preference so user sees login screen again
      storage.remove('skip_login');

      // Sign out from Firebase
      await auth(getApp()).signOut();

      // Sign out from Google Sign-In
      try {
        await GoogleSignin.signOut();
      } catch (err) {
        console.error('Google Sign-Out error:', err);
      }

      analyticsService.logSignOut();

      console.log(' Logout complete - all local data cleared');
    } catch (err: any) {
      console.error('Error signing out:', err);
      crashlyticsService.recordError(err, 'SignOutError');
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
