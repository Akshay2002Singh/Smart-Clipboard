import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.secondary };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'text':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.error };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'text':
        return colors.primary;
      case 'danger':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        isDisabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

