import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text, TextInput, Platform, ToastAndroid, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useClipboard } from 'src/hooks/useClipboard';
import { useAuth } from '@context/AuthContext';
import { useDialog } from '@context/DialogContext';
import { Input, Button } from '@components/common';

import { useTheme } from '@theme';
import { Portal, Dialog, Paragraph, Button as PaperButton, Checkbox } from 'react-native-paper';
import { storage } from '@storage/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { clipboardRepository } from '@storage/repositories';
import { clipboardEditScreenStyles as styles } from './ClipboardEditScreen.styles';
import { isNetworkAvailable } from '@utils/network';
import { STORAGE_KEYS } from '../../constants/storage';
import { firebaseSyncService } from '@/services';

const DEFAULT_CATEGORIES = ['Work', 'Personal', 'Links', 'Notes', 'Shopping', 'Other'];

export const TemplateEditScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { isAuthenticated, signInWithGoogle } = useAuth();
  const { showAlert, showConfirm, showLoader, hideLoader } = useDialog();
  const { addItem, updateItem, deleteItem, getCategories, addCustomCategory } = useClipboard();
  const item = route.params?.item;

  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [category, setCategory] = useState(item?.category || '');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [favorite, setFavorite] = useState(item?.favorite || false);
  const [isSaving, setIsSaving] = useState(false);
  const [customCategoriesRefresh, setCustomCategoriesRefresh] = useState(0);
  // Info dialog state for template usage
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const [infoDontShowAgain, setInfoDontShowAgain] = useState(false);
  // Track how the info dialog was opened (auto vs info button)
  const [infoOpenedViaButton, setInfoOpenedViaButton] = useState(false);

  // Templates are always templates
  const isTemplate = true;
  const categoryScrollRef = useRef<ScrollView>(null);

  // Get custom categories list
  const customCategories = useMemo(() => {
    return clipboardRepository.getCustomCategories();
  }, [customCategoriesRefresh]);

  // Get all categories: default + custom (stored in DB) + categories from existing items
  const allCategories = useMemo(() => {
    clipboardRepository.getAll();
    const existingCategories = getCategories();

    const categoryMap = new Map<string, string>();

    DEFAULT_CATEGORIES.forEach(cat => {
      categoryMap.set(cat.toLowerCase(), cat);
    });

    customCategories.forEach(cat => {
      if (cat && cat.trim()) {
        categoryMap.set(cat.toLowerCase(), cat.trim());
      }
    });

    existingCategories.forEach(cat => {
      if (cat && cat.trim()) {
        categoryMap.set(cat.toLowerCase(), cat.trim());
      }
    });

    // Keep default categories first, then add custom categories in order (no sorting)
    const defaults = DEFAULT_CATEGORIES;
    const others = Array.from(categoryMap.values())
      .filter(cat => !defaults.includes(cat));

    return [...defaults, ...others];
  }, [customCategoriesRefresh, customCategories, getCategories]);

  const categoryExists = allCategories.some(cat =>
    cat.toLowerCase() === newCategoryInput.toLowerCase()
  );
  const showCreateOption = newCategoryInput.trim() && !categoryExists;

  const showToast = async (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      await showAlert(message);
    }
  };

  // Smooth scroll to end with slow animation
  // Uses incremental scrollTo calls to create a gradual scroll effect
  const smoothScrollToEnd = (duration: number = 800) => {
    const scrollView = categoryScrollRef.current;
    if (!scrollView) return;

    const steps = 15;
    const stepDuration = duration / steps;
    let currentStep = 0;
    let currentX = 0;
    const increment = 100; // pixels per step

    const animateStep = () => {
      currentStep++;
      currentX += increment;
      if (currentStep < steps) {
        scrollView.scrollTo({ x: currentX, animated: true });
        setTimeout(animateStep, stepDuration);
      } else {
        // Final step: scroll to the very end
        scrollView.scrollToEnd({ animated: true });
      }
    };

    animateStep();
  };

  useEffect(() => {
    navigation.setOptions({
      title: item ? 'Edit Template' : 'New Template',
      headerRight: item ? () => (
        <TouchableOpacity
          onPress={() => setDeleteDialogVisible(true)}
          style={{ marginRight: 16 }}
        >
          <Icon name="delete" size={24} color={colors.error} />
        </TouchableOpacity>
      ) : undefined,
    });
  }, [item, navigation, colors.error]);


  // Auto‑open on first mount (if not dismissed)
  useEffect(() => {
    const dismissed = storage.get<boolean>(STORAGE_KEYS.TEMPLATE_INFO_DISMISSED, false);
    if (!dismissed) {
      setInfoOpenedViaButton(false); // auto open
      setInfoDialogVisible(true);
    }

    if (categoryScrollRef.current) {
      setTimeout(() => {
        smoothScrollToEnd(600);
      }, 600);
    }
  }, []);

  const handleInfoClose = async () => {
    // Only persist the "don't show again" preference when the dialog was opened automatically
    if (!infoOpenedViaButton && infoDontShowAgain) {
      await storage.set(STORAGE_KEYS.TEMPLATE_INFO_DISMISSED, true);
    }
    setInfoDialogVisible(false);
    setInfoOpenedViaButton(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      await showAlert('Please fill in both title and content', 'Error');
      return;
    }

    // Normalize template variables: trim spaces inside {{ }}
    // e.g., "{{ my name }}" → "{{my name}}", "{{  reason  }}" → "{{reason}}"
    const normalizedContent = content.replace(
      /\{\{\s*(.*?)\s*\}\}/g,
      (_match: string, varName: string) => `{{${varName.trim()}}}`
    );

    const finalCategory = category.trim() || undefined;

    try {
      setIsSaving(true);


      if (item) {
        await updateItem(item.id, { title, content: normalizedContent, category: finalCategory, favorite, isTemplate });
      } else {
        await addItem({ title, content: normalizedContent, category: finalCategory, favorite, isTemplate });
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving item:', error);
      if (error?.message?.includes('Limit reached') === false && error?.message?.includes(' exceeds limit of ') === false) {
        const errorMessage = error.message?.includes('No internet')
          ? 'No internet connection'
          : 'Failed to save item. Please try again.';
        await showAlert(errorMessage, 'Error');
      }
    } finally {
      setIsSaving(false);
    }
  };



  const handleDelete = async () => {
    if (item) {
      try {
        await deleteItem(item.id);
        navigation.goBack();
      } catch (error: any) {
        console.error('Error deleting item:', error);
        await showAlert('Failed to delete item. Please try again.', 'Error');
      }
    }
  };

  // Check if a category is custom (not default)
  const isCustomCategory = (cat: string): boolean => {
    if (!cat) return false;
    const isDefault = DEFAULT_CATEGORIES.some(d => d.toLowerCase() === cat.toLowerCase());
    if (isDefault) return false;

    // Check if it's in custom categories list
    const isInCustom = customCategories.some(c => c.toLowerCase() === cat.toLowerCase());
    return isInCustom;
  };

  const handleCategorySelect = (selectedCategory: string) => {
    if (category === selectedCategory) {
      setCategory('');
    } else {
      setCategory(selectedCategory);
    }
  };

  const handleCreateCategory = async () => {
    const trimmedCategory = newCategoryInput.trim();
    if (!trimmedCategory) return;

    if (categoryExists) {
      showToast('Category already exists');
      return;
    }

    try{
      showLoader('Creating category...');
      // Save custom category to database
      await addCustomCategory(trimmedCategory);
      // Trigger refresh of categories list
      setCustomCategoriesRefresh(prev => prev + 1);
      setCategory(trimmedCategory);
      setNewCategoryInput(''); // Clear input after creating
      // Scroll to the end to show the new category with slow animation
      setTimeout(() => {
        smoothScrollToEnd(800);
      }, 100);  
    }catch(error: any){
      console.error('Error creating category:', error);
      if(error?.message === "No internet connection"){
        await showAlert('No internet connection', 'Error');
      }else{
        await showAlert('Failed to create category. Please try again.', 'Error');
      }
    }finally{
      hideLoader();
    }
  };

  const handleDeleteCategory = (categoryToDelete: string, event: any) => {
    if (event && event.stopPropagation) {
      event.stopPropagation(); // Prevent category selection when clicking delete
    }

    // Check if category is in use by any clipboard item or template
    const allItems = clipboardRepository.getAll();
    const itemsUsingCategory = allItems.filter(
      item => item.category?.toLowerCase() === categoryToDelete.toLowerCase()
    );

    if (itemsUsingCategory.length > 0) {
      showAlert(
        `Cannot delete "${categoryToDelete}" because it is used by ${itemsUsingCategory.length} item(s). Please remove or change the category from those items first.`,
        'Category In Use'
      );
      return;
    }

    showConfirm(
      `Are you sure you want to delete "${categoryToDelete}"?`,
      'Delete Category',
      async () => {
        try {
          showLoader('Deleting category...');
          await firebaseSyncService.deleteCustomCategory(categoryToDelete);
          setCustomCategoriesRefresh(prev => prev + 1);
          // Clear selection if deleted category was selected
          if (category === categoryToDelete) {
            setCategory('');
          }
          showToast('Category deleted');
        } catch (error) {
          console.error('Error deleting category:', error);
          showAlert('Failed to delete category. Please try again.', 'Error');
        } finally{
          hideLoader();
        }
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      {/* Informational Dialog */}
      <Portal>
        <Dialog visible={infoDialogVisible} onDismiss={handleInfoClose} style={{ backgroundColor: colors.card }}>
          <Dialog.Title style={{ color: colors.text }}>Template Information</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: colors.text }}>
              {`Templates help you create reusable text with placeholders.

How variables work:
• A variable must be inside double curly braces, like {{my name}}.
• Variables may include spaces inside (e.g., {{account number}}).
• Variables cannot start or end with a space (❌ {{ my }}  ❌ {{name }}).

Example:
Hello {{name}},
Today I will be on leave due to {{reason}}.`}
            </Paragraph>
            {/* Show the "Don't show again" checkbox only when the dialog is opened automatically */}
            {!infoOpenedViaButton && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Checkbox
                  status={infoDontShowAgain ? 'checked' : 'unchecked'}
                  onPress={() => setInfoDontShowAgain(!infoDontShowAgain)}
                  color={colors.primary}
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
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter template title"
        />

        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Content</Text>
            {/* Info button for template usage */}
            <TouchableOpacity
              onPress={() => {
                setInfoOpenedViaButton(true);
                setInfoDialogVisible(true);
              }}
              style={styles.iconButton}
            >
              <Icon name="info" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: 8 }]}>
            {"Add placeholders using {{variableName}} — they will be filled when you copy the template."}
          </Text>
          <Input
            value={content}
            onChangeText={setContent}
            placeholder="Use {{variableName}} to mark parts that should be filled later."
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.categoryContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Category (Optional)</Text>

          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsContainer}
            contentContainerStyle={styles.chipsContent}
          >
            {allCategories.map((cat) => {
              const isSelected = category === cat;
              const isCustom = isCustomCategory(cat);
              return (
                <View key={cat} style={styles.chipWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {cat}
                    </Text>
                    {isCustom && (
                      <TouchableOpacity
                        style={[
                          styles.deleteButton,
                          {
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(244,67,54,0.1)',
                          }
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat, e);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Icon
                          name="close"
                          size={18}
                          color={isSelected ? '#FFFFFF' : colors.error}
                        />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.newCategoryRow}>
            <View style={styles.newCategoryInputContainer}>
              <TextInput
                style={[styles.newCategoryInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={newCategoryInput}
                onChangeText={setNewCategoryInput}
                placeholder="Type to create new category"
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: newCategoryInput.trim() ? colors.primary : colors.disabled,
                  opacity: newCategoryInput.trim() ? 1 : 0.5,
                },
              ]}
              onPress={handleCreateCategory}
              disabled={!newCategoryInput.trim()}
              activeOpacity={0.7}
            >
              <Icon name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.favoriteContainer}
          onPress={() => setFavorite(!favorite)}
        >
          <Icon
            name={favorite ? "star" : "star-border"}
            size={24}
            color={favorite ? "#FFD700" : colors.textSecondary}
          />
          <Text style={[styles.favoriteText, { color: colors.text }]}>
            {favorite ? 'Favorite' : 'Add to favorites'}
          </Text>
        </TouchableOpacity>

        <Button
          title={item ? 'Update Template' : 'Create Template'}
          onPress={handleSave}
          variant="primary"
          style={styles.saveButton}
          disabled={isSaving}
          loading={isSaving}
        />

        <Portal>
          <Dialog
            visible={deleteDialogVisible}
            onDismiss={() => setDeleteDialogVisible(false)}
            style={{ backgroundColor: colors.card }}
          >
            <Dialog.Title style={{ color: colors.text }}>Delete Template</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ color: colors.text }}>
                Are you sure you want to delete this template? This action cannot be undone.
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <PaperButton onPress={() => setDeleteDialogVisible(false)} textColor={colors.text}>
                Cancel
              </PaperButton>
              <PaperButton onPress={handleDelete} textColor={colors.error}>
                Delete
              </PaperButton>
            </Dialog.Actions>
          </Dialog>
        </Portal>


      </ScrollView>
    </KeyboardAvoidingView>
  );
};

