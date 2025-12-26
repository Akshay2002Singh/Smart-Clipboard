import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ToastAndroid,
  Image,
} from 'react-native';
import { useTheme } from '@theme';
import { useAuth } from '@context/AuthContext';
import { useDialog } from '@context/DialogContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@components/common';

interface LoginScreenProps {
  onSkip?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSkip }) => {
  const { colors } = useTheme();
  const { signInWithGoogle } = useAuth();
  const { showAlert } = useDialog();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMessage = error?.message || 'Failed to sign in with Google. Please try again.';
      ToastAndroid.show(errorMessage, ToastAndroid.LONG);
      // await showAlert(
      //   errorMessage,
      //   'Sign In Failed'
      // );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/images/copy.png')} 
            style={{ width: 220, height: 220 }} 
            resizeMode="contain"
          />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          Smart Clipboard
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sync your clipboard items across devices
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? 'Signing in...' : 'Sign in with Google'}
            onPress={handleGoogleSignIn}
            variant="primary"
            disabled={isLoading}
            style={styles.googleButton}
            icon={
              isLoading ? (
                <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <MaterialCommunityIcons name="google" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              )
            }
          />

          <TouchableOpacity
            style={[styles.skipButton, { borderColor: colors.border }]}
            onPress={handleContinueWithoutLogin}
            disabled={isLoading}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              Continue without login
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          You can use the app without signing in, but your data won't be synced across devices.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  googleButton: {
    marginBottom: 16,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

