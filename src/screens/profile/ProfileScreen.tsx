import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Image,
  ToastAndroid,
} from 'react-native';
import { useTheme } from '@theme';
import { useAuth } from '@context/AuthContext';
import { useDialog } from '@context/DialogContext';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { firebaseSyncService } from '@services/FirebaseSyncService';
import { clipboardRepository } from '@storage/repositories';
import { StyleSheet } from 'react-native';

const PRIVACY_POLICY_URL = 'https://akshay2002singh.github.io/Smart-Clipboard/PRIVACY-POLICY';

export const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, signInWithGoogle, signOut, isAuthenticated } = useAuth();
  const { showAlert } = useDialog();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const handleDeleteAllData = () => {
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete all data from Firebase (items and custom categories)
      await firebaseSyncService.deleteAllUserData();

      // Clear all local data
      clipboardRepository.clearAll();

      await signOut();
      await showAlert('All your data has been deleted.', 'Success');
    } catch (error: any) {
      console.error('Error deleting all data:', error);
      if(error?.message === "No internet connection"){
        await showAlert('No internet connection', 'Error');
      }else{
        await showAlert('Failed to delete all data. Please try again.', 'Error');
      }
    } finally {
      setIsDeleting(false);
      setDeleteConfirmVisible(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL).catch(async (err) => {
      console.error('Error opening privacy policy:', err);
      await showAlert('Could not open privacy policy link.', 'Error');
    });
  };

useEffect(() => {
      const autoLogin = async () => {
        if (!isAuthenticated) {
          try {
            setIsSigningIn(true);
            await signInWithGoogle();
          } catch (error: any) {
            console.error('Error signing in with Google:', error);
            // Don't show toast for cancellation to keep it clean, or keep it if preferred
            if (error.message !== 'Google Sign-In cancelled' && error.message !== 'User cancelled Google Sign-In') {
              const errorMessage = error?.message || 'Failed to sign in with Google. Please try again.';
              ToastAndroid.show(errorMessage, ToastAndroid.LONG);
            }
          } finally {
            console.log("false");
            setIsSigningIn(false);
          }
        }
      };

      autoLogin();
}, []);

  // If not logged in, show prompt and redirect to login on tap
  if (!user) {
    if (isSigningIn) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.text }}>Signing in...</Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 16 }]}>
        <Icon name="account-circle" size={64} color={colors.primary} style={{ marginBottom: 12 }} />
        <Text style={[styles.message, { color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }]}>
          Login to view and manage your profile
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
            {user.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Icon name="account-circle" size={64} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.emailText, { color: colors.text }]}>
            {user.email}
          </Text>
        </View>

        {/* Privacy & Data Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy & Data</Text>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: colors.border }]}
            onPress={handleOpenPrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Icon name="policy" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, styles.lastActionRow]}
            onPress={handleDeleteAllData}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
                <Icon name="delete-forever" size={20} color={colors.error} />
              </View>
              <Text style={[styles.actionText, { color: colors.error }]}>Delete All My Data</Text>
            </View>
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Icon name="chevron-right" size={24} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer - Fixed at bottom */}
      <View style={[styles.footer]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteConfirmVisible}
        title="Delete All Data"
        message="Are you sure you want to delete all your data? This action cannot be undone and will delete all your clipboard items, templates, and categories from both this device and the cloud."
        confirmText="DELETE ALL MY DATA"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        onDismiss={handleCancelDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Space for footer
  },
  message: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  profileHeader: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  lastActionRow: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
  },
});

