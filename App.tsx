import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@theme';
import { AppProviders, useAuth } from '@context';
import { AppNavigator } from '@navigation';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { View, ActivityIndicator, Text } from 'react-native';
import { storage } from '@storage/storage';
import { firebaseSyncService } from './src/services/FirebaseSyncService';

import { crashlyticsService } from './src/services/CrashlyticsService';

const SKIP_LOGIN_KEY = 'skip_login';

const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const [hasSkippedLogin, setHasSkippedLogin] = useState(false);
  const [checkingSkip, setCheckingSkip] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    crashlyticsService.log('App Mounted');
    // Check if user previously skipped login
    const skipped = storage.get<boolean>(SKIP_LOGIN_KEY, false);
    setHasSkippedLogin(skipped);
    setCheckingSkip(false);
  }, []);

  // Fetch from Firebase first on app open, fallback to local if fails
  useEffect(() => {
    if (!isLoading && isAuthenticated && !syncing) {
      setSyncing(true);
      // Try to fetch from Firebase first
      firebaseSyncService.pullFromFirebase()
        .then(() => {
          console.log('✅ Fetched data from Firebase successfully');
        })
        .catch((err: any) => {
          // If Firebase fetch fails, use local data (already loaded)
          if (err.message?.includes('No internet')) {
            console.log('⚠️ No internet. Using local saved data.');
          } else {
            console.log('⚠️ Firebase fetch failed. Using local saved data.');
            console.error('Error details:', err);
          }
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || checkingSkip || syncing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        {syncing && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.text, fontSize: 14 }}>Syncing data...</Text>
          </View>
        )}
      </View>
    );
  }

  // Show login screen if not authenticated and hasn't skipped login
  if (!isAuthenticated && !hasSkippedLogin) {
    return <LoginScreen onSkip={() => {
      storage.set(SKIP_LOGIN_KEY, true);
      setHasSkippedLogin(true);
    }} />;
  }

  // Show main app
  return <AppNavigator />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProviders>
          <StatusBar style="auto" />
          <AppContent />
        </AppProviders>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

