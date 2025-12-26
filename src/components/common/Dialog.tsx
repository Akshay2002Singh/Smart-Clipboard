import React from 'react';
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

export interface DialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface DialogProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: DialogButton[];
  onDismiss?: () => void;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  title,
  message,
  buttons = [],
  onDismiss,
}) => {
  const { colors } = useTheme();

  const defaultButtons: DialogButton[] = buttons.length > 0 
    ? buttons 
    : [{ text: 'OK', onPress: () => onDismiss?.() || null, style: 'default' }];

  const handleBackdropPress = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.dialog, { backgroundColor: colors.card }]}>
              {title && (
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              )}
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
              <View style={styles.buttonContainer}>
                {defaultButtons.map((button, index) => {
                  const isDestructive = button.style === 'destructive';
                  const isCancel = button.style === 'cancel';
                  
                  return (
                    <Button
                      key={index}
                      title={button.text}
                      onPress={() => {
                        button.onPress();
                        onDismiss?.();
                      }}
                      variant={isDestructive ? 'danger' : isCancel ? 'outline' : 'primary'}
                      style={[
                        styles.button,
                        defaultButtons.length > 1 && index < defaultButtons.length - 1 && styles.buttonMargin,
                      ]}
                    />
                  );
                })}
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
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 80,
  },
  buttonMargin: {
    marginRight: 0,
  },
});

