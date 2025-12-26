import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ToastAndroid,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '@theme';
import { useDialog } from '@context/DialogContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@components/common';

interface TemplateModalProps {
  visible: boolean;
  onClose: () => void;
  templateContent: string;
  templateTitle: string;
}

// Extract all template variables from content (e.g., {{myName}} -> ['myName'])
const extractTemplateVariables = (content: string): string[] => {
  const regex = /\{\{([^\s][^}]*[^\s])\}\}/g;
  const variables = new Set<string>();
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
};

// Replace template variables with values
const replaceTemplateVariables = (content: string, values: Record<string, string>): string => {
  let result = content;
  Object.keys(values).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, values[key]);
  });
  return result;
};

export const TemplateModal: React.FC<TemplateModalProps> = ({
  visible,
  onClose,
  templateContent,
  templateTitle,
}) => {
  const { colors } = useTheme();
  const { showAlert } = useDialog();
  const variables = extractTemplateVariables(templateContent);
  const [values, setValues] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const [isCopying, setIsCopying] = useState(false);

  // Check if template has variables
  const hasVariables = variables.length > 0;

  const handleDirectCopy = async () => {
    setIsCopying(true);
    try {
      await Clipboard.setStringAsync(templateContent);
      showToast('Copied to clipboard!');
      onClose();
    } catch (error) {
      showToast('Failed to copy to clipboard');
    } finally {
      setIsCopying(false);
    }
  };

  useEffect(() => {
    // Initialize values when modal opens
    if (visible) {
      if (hasVariables) {
        const initialValues: Record<string, string> = {};
        variables.forEach(variable => {
          initialValues[variable] = '';
        });
        setValues(initialValues);
      } else {
        // No variables, copy directly and close
        handleDirectCopy();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, templateContent]);

  const handleValueChange = (variable: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [variable]: value,
    }));
  };

  const handleCopy = async () => {
    setIsCopying(true);
    const filledContent = replaceTemplateVariables(templateContent, values);
    
    try {
      await Clipboard.setStringAsync(filledContent);
      showToast('Copied to clipboard!');
      onClose();
    } catch (error) {
      showToast('Failed to copy to clipboard');
    } finally {
      setIsCopying(false);
    }
  };

  const showToast = async (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      await showAlert(message);
    }
  };

  const allFieldsFilled = variables.every(variable => values[variable]?.trim());

  // If no variables, don't show modal
  if (!hasVariables) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, { backgroundColor: colors.card }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Fill Template: {templateTitle}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {variables.map((variable, index) => {
                const isLast = index === variables.length - 1;
                return (
                  <View key={variable} style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {variable}
                    </Text>
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[variable] = ref;
                      }}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder={`Enter ${variable}`}
                      placeholderTextColor={colors.placeholder}
                      value={values[variable] || ''}
                      onChangeText={(text) => handleValueChange(variable, text)}
                      returnKeyType={isLast ? 'done' : 'next'}
                      onSubmitEditing={() => {
                        if (isLast) {
                          // If all fields are filled, copy to clipboard
                          if (allFieldsFilled) {
                            handleCopy();
                          }
                        } else {
                          // Move to next field
                          const nextVariable = variables[index + 1];
                          inputRefs.current[nextVariable]?.focus();
                        }
                      }}
                      blurOnSubmit={isLast}
                    />
                  </View>
                );
              })}

              {variables.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Icon name="info" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No template variables found. Use {'{{'}variableName{'}}'} format.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={onClose}
                variant="outline"
                style={{ ...styles.cancelButton, marginRight: 6 }}
              />
              <Button
                title={isCopying ? "Copying..." : "Copy"}
                onPress={handleCopy}
                variant="primary"
                disabled={!allFieldsFilled || variables.length === 0 || isCopying}
                style={{ ...styles.copyButton, marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cancelButton: {
    flex: 1,
  },
  copyButton: {
    flex: 1,
  },
});

