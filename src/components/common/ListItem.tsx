import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '@theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
  showChevron?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  onPress,
  rightIcon,
  leftIcon,
  style,
  showChevron = false,
}) => {
  const { colors } = useTheme();

  const content = (
    <View style={[styles.container, style]}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.rightContent}>
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        {showChevron && (
          <Icon name="chevron-right" size={24} color={colors.textSecondary} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIcon: {
    marginRight: 8,
  },
});

