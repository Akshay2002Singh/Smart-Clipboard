import React from 'react';
import { Alert, Platform } from 'react-native';
import { Dialog, Paragraph, Button as PaperButton, Portal } from 'react-native-paper';

interface LoginWarningDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onLogin: () => void;
  onContinue: () => void;
}

export const LoginWarningDialog: React.FC<LoginWarningDialogProps> = ({
  visible,
  onDismiss,
  onLogin,
  onContinue,
}) => {
  if (Platform.OS === 'android') {
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={onDismiss}>
          <Dialog.Title>Login Recommended</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              You're not logged in. Your data will only be stored locally and may be lost if you uninstall the app or clear app data.
            </Paragraph>
            <Paragraph style={{ marginTop: 12 }}>
              Login to sync your data to the cloud and access it from any device.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            {/* <PaperButton onPress={onDismiss}>Cancel</PaperButton> */}
            <PaperButton onPress={onContinue}>Continue Without Login</PaperButton>
            <PaperButton onPress={onLogin} mode="contained" style={{ paddingHorizontal:12 }}>Login</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  // iOS fallback
  return null;
};


