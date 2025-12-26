import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, TextInput, StyleSheet, Keyboard, TouchableWithoutFeedback, Text, Share, Platform, ToastAndroid, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { Checkbox, Portal, Dialog, Paragraph, Button as PaperButton } from 'react-native-paper';
import { useTheme } from '@theme';
import { storage } from '@storage/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import { useDialog } from '@context/DialogContext';
import { STORAGE_KEYS } from '../../constants/storage';

const NOTEPAD_STORAGE_KEY = STORAGE_KEYS.NOTEPAD_CONTENT;


export const NotepadScreen: React.FC = () => {
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showAlert, showConfirm } = useDialog();

  // History state for Undo/Redo
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Show informational popup about local-only storage (once, with "Don't show again")
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [infoDontShowAgain, setInfoDontShowAgain] = useState(false);
  // Track how the info dialog was opened (auto vs info button)
  const [infoOpenedViaButton, setInfoOpenedViaButton] = useState(false);

  useEffect(() => {
    const dismissed = storage.get<boolean>(STORAGE_KEYS.NOTEPAD_INFO_DISMISSED, false);
    if (!dismissed) {
      setInfoOpenedViaButton(false); // auto open
      setInfoDialogVisible(true);
    }
  }, []);

  const handleInfoClose = async () => {
    // Persist dismissal only when dialog opened automatically
    if (!infoOpenedViaButton && infoDontShowAgain) {
      await storage.set(STORAGE_KEYS.NOTEPAD_INFO_DISMISSED, true);
    }
    setInfoDialogVisible(false);
    setInfoOpenedViaButton(false);
  };

  // Load initial content
  useEffect(() => {
    const savedContent = storage.get<string>(NOTEPAD_STORAGE_KEY, '');
    if (savedContent) {
      setContent(savedContent);
      setHistory([savedContent]);
      setHistoryIndex(0);
    }
  }, []);

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addToHistory = (newContent: string) => {
    setHistory(prev => {
      const current = prev.slice(0, historyIndex + 1);
      // Don't add if same as last
      if (current[current.length - 1] === newContent) return prev;
      const next = [...current, newContent];
      // Limit history to 50 steps
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIndex(prev => {
      const newLength = prev + 2; // +1 for 0 based index, +1 for new item
      const index = newLength > 50 ? 49 : prev + 1;
      return index;
    });
  };

  const handleChangeText = (text: string) => {
    setContent(text);
    setIsSaving(true);

    // Save to storage debounce
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      storage.set(NOTEPAD_STORAGE_KEY, text);
      setIsSaving(false);
    }, 1000);

    // Save to history debounce (wait for pause in typing)
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(() => {
      addToHistory(text);
    }, 800);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevContent = history[newIndex];
      setContent(prevContent);
      setHistoryIndex(newIndex);
      // Also update storage immediately when undoing
      storage.set(NOTEPAD_STORAGE_KEY, prevContent);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setContent(nextContent);
      setHistoryIndex(newIndex);
      // Also update storage immediately when redoing
      storage.set(NOTEPAD_STORAGE_KEY, nextContent);
    }
  };

  const handleCopy = async () => {
    if (!content) return;
    await Clipboard.setStringAsync(content);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
    }
  };

  const handleShare = async () => {
    if (!content) return;
    try {
      await Share.share({
        message: content,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleClear = () => {
    if (!content) return;
    showConfirm(
      'Are you sure you want to clear the notepad?',
      'Clear Notepad',
      () => {
        setContent('');
        setHistory(['']);
        setHistoryIndex(0);
        storage.set(NOTEPAD_STORAGE_KEY, '');
        setIsSaving(false);
      }
    );
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        {/* Informational Dialog */}
        <Portal>
          <Dialog visible={infoDialogVisible} onDismiss={handleInfoClose} style={{ backgroundColor: colors.card }}>
            <Dialog.Title>How Your Notes Are Saved</Dialog.Title>
            <Dialog.Content>
              <Paragraph>
                Your notes are stored only on this device. They are not uploaded or synced online, so they won’t appear on other devices. If you uninstall the app, your notes may be lost.
              </Paragraph>
              {/* Show checkbox only when dialog opened automatically */}
              {!infoOpenedViaButton && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                  <Checkbox
                    status={infoDontShowAgain ? 'checked' : 'unchecked'}
                    onPress={() => setInfoDontShowAgain(!infoDontShowAgain)}
                  />
                  <Text style={{ color: colors.text, marginLeft: 8 }}>Don't show again</Text>
                </View>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <PaperButton onPress={handleInfoClose} textColor={colors.primary}>OK</PaperButton>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        {/* Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: colors.textSecondary }]}>
              {wordCount} Words
            </Text>
            <Text style={[styles.statsText, { color: colors.textSecondary }]}>
              {charCount} Chars
            </Text>
            <Text style={[styles.savingText, { color: isSaving ? colors.primary : colors.textSecondary, opacity: 0.7 }]}>
              {isSaving ? 'Saving...' : 'Saved'}
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={handleUndo} disabled={!canUndo} style={styles.iconButton}>
              <Icon name="undo" size={20} color={canUndo ? colors.text : colors.textSecondary + '50'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRedo} disabled={!canRedo} style={styles.iconButton}>
              <Icon name="redo" size={20} color={canRedo ? colors.text : colors.textSecondary + '50'} />
            </TouchableOpacity>
            <View style={{ width: 1, height: 16, backgroundColor: colors.border, marginHorizontal: 2 }} />
            <TouchableOpacity onPress={handleCopy} disabled={!content} style={styles.iconButton}>
              <Icon name="content-copy" size={20} color={content ? colors.text : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} disabled={!content} style={styles.iconButton}>
              <Icon name="share" size={20} color={content ? colors.text : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClear} disabled={!content} style={styles.iconButton}>
              <Icon name="delete-outline" size={22} color={content ? colors.error : colors.textSecondary} />
            </TouchableOpacity>
            {/* Re‑open info dialog */}
            <TouchableOpacity
              onPress={() => {
                setInfoOpenedViaButton(true);
                setInfoDialogVisible(true);
              }}
              style={styles.iconButton}
            >
              <Icon name="info" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={[styles.input, { color: colors.text }]}
          multiline
          placeholder="Start typing your notes here..."
          placeholderTextColor={colors.textSecondary}
          value={content}
          onChangeText={handleChangeText}
          textAlignVertical="top"
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsContainer: {
    justifyContent: 'center',
  },
  statsText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  savingText: {
    fontSize: 9,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Reduced gap from 16
  },
  iconButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});
