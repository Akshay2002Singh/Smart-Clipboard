import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 2,
}) => {
  const { colors } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: elevation,
    },
    shadowOpacity: 0.1,
    shadowRadius: elevation * 2,
    elevation: elevation,
    borderWidth: 1,
    borderColor: colors.border,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({});

