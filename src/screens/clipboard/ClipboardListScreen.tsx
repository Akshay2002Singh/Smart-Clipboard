import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
  ToastAndroid,
  KeyboardAvoidingView,
} from 'react-native';
import { useClipboard } from 'src/hooks/useClipboard';
import { Card, ListItem, Button, IconWrapper } from 'src/components/common';
import { LoginWarningDialog } from 'src/components/common/LoginWarningDialog';
import { useAuth } from 'src/context/AuthContext';
import { useTheme } from '@theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { debounce } from 'src/utils/debounce';
import { TemplateModal } from 'src/components/clipboard/TemplateModal';
import { clipboardListScreenStyles as styles } from './ClipboardListScreen.styles';
import { crashlyticsService } from "../../services/CrashlyticsService";

export const ClipboardListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const {
    items,
    searchQuery,
    selectedCategory,
    searchItems,
    filterByCategory,
    copyToClipboard,
    getCategories,
    toggleFavorite,
  } = useClipboard();
  const { isAuthenticated, signInWithGoogle } = useAuth();

  const [searchText, setSearchText] = useState(searchQuery);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loginWarningVisible, setLoginWarningVisible] = useState(false);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchItems(query);
    }, 300),
    [searchItems]
  );

  const handleSearch = (text: string) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // iOS doesn't have native toast, but we can use Alert for now
      // Or you could use a library like react-native-root-toast
      console.log(message);
    }
  };

  const handleCopy = async (item: any) => {
    try {
      await copyToClipboard(item);
      showToast('Copied to clipboard!');
    } catch (error) {
      showToast('Failed to copy to clipboard');
    }
  };

  const handleCardPress = async (item: any) => {
    if (item.isTemplate) {
      // Show template modal for template items
      setSelectedTemplate(item);
      setTemplateModalVisible(true);
    } else {
      // Regular copy for non-template items
      await handleCopy(item);
    }
  };



  const handleToggleFavorite = (item: any) => {
    toggleFavorite(item.id);
  };

  const handleFabPress = () => {
    if (isAuthenticated) {
      navigation.navigate('ClipboardEdit', {});
    } else {
      setLoginWarningVisible(true);
    }
  };

  const handleContinueOffline = () => {
    setLoginWarningVisible(false);
    navigation.navigate('ClipboardEdit', {});
  };

  const handleLogin = async () => {
    setLoginWarningVisible(false);
    // Add a small delay to allow the modal to dismiss completely before starting login
    // This prevents "activity is null" errors on Android
    setTimeout(async () => {
      try {
        await signInWithGoogle();
        // Navigate after successful login
        navigation.navigate('ClipboardEdit', {});
      } catch (error) {
        console.error('Login failed:', error);
        // Optional: Show error to user
      }
    }, 1000);
  };

  const categories = getCategories();

  // Filter to show only non-template items
  let filteredItems = items.filter(item => !item.isTemplate);

  if (selectedCategory) {
    filteredItems = filteredItems.filter(item => item.category === selectedCategory);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Search clipboard items..."
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {categories.length > 0 && (
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && { backgroundColor: colors.primary },
            ]}
            onPress={() => filterByCategory(null)}
          >
            <Text style={[
              styles.categoryText,
              !selectedCategory && { color: '#FFFFFF' },
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && { backgroundColor: colors.primary },
              ]}
              onPress={() => filterByCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && { color: '#FFFFFF' },
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => handleCardPress(item)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <View style={styles.titleContainer}>
                    <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.text, marginRight: 8 }]}>
                      {item.title}
                    </Text>
                    {/* {item.isTemplate && (
                      <View style={[styles.templateBadge, { backgroundColor: colors.primary }]}>
                        <Icon name="description" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.templateBadgeText}>Template</Text>
                      </View>
                    )} */}
                  </View>
                </View>
                {item.category && (
                  <View style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: (colors.category && colors.category[item.category.toLowerCase() as keyof typeof colors.category])
                        || colors.category?.default
                        || colors.primary
                    },
                  ]}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                    onPress={() => handleToggleFavorite(item)}
                    style={styles.favoriteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon
                      name={item.favorite ? "star" : "star-border"}
                      size={24}
                      color={item.favorite ? "#FFD700" : colors.textSecondary}
                    />
                  </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (item.isTemplate) {
                      setSelectedTemplate(item);
                      setTemplateModalVisible(true);
                    } else {
                      handleCopy(item);
                    }
                  }}
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="content-copy" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ClipboardEdit', { item })}
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="edit" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            <Text
              style={[styles.cardContentText, { color: colors.textSecondary }]}
              numberOfLines={3}
            >
              {item.content}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="content-paste" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No clipboard items yet
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleFabPress}
      >
        <Icon name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {selectedTemplate && (
        <TemplateModal
          visible={templateModalVisible}
          onClose={() => {
            setTemplateModalVisible(false);
            setSelectedTemplate(null);
          }}
          templateContent={selectedTemplate.content}
          templateTitle={selectedTemplate.title}
        />
      )}

      <LoginWarningDialog
        visible={loginWarningVisible}
        onDismiss={() => setLoginWarningVisible(false)}
        onContinue={handleContinueOffline}
        onLogin={handleLogin}
      />
    </KeyboardAvoidingView>
  );
};


