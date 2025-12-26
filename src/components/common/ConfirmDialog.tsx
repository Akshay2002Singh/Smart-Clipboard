import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '@theme';
import { Button } from './Button';
import { Input } from './Input';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  onConfirm,
  onCancel,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const isConfirmed = inputValue.trim() === confirmText;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      handleDismiss();
    } else {
      setError(`Please type "${confirmText}" to confirm`);
    }
  };

  const handleDismiss = () => {
    setInputValue('');
    setError('');
    onDismiss();
  };

  const handleCancel = () => {
    handleDismiss();
    onCancel();
  };

  const handleBackdropPress = () => {
    handleDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.dialog, { backgroundColor: colors.card }]}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
              <Text style={[styles.confirmLabel, { color: colors.text }]}>
                Type <Text style={[styles.confirmText, { color: colors.error }]}>{confirmText}</Text> to confirm:
              </Text>
              <Input
                value={inputValue}
                onChangeText={(text) => {
                  setInputValue(text);
                  setError('');
                }}
                placeholder={confirmText}
                autoCapitalize="characters"
                error={error}
                style={styles.input}
              />
              <View style={styles.buttonContainer}>
                <Button
                  title={cancelButtonText}
                  onPress={handleCancel}
                  variant="outline"
                  style={styles.button}
                />
                <Button
                  title={confirmButtonText}
                  onPress={handleConfirm}
                  variant="danger"
                  disabled={!isConfirmed}
                  style={styles.button}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  confirmText: {
    fontWeight: '700',
  },
  input: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
});

