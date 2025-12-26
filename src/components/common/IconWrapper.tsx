import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme';

interface IconWrapperProps {
  children: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
  children,
  size = 40,
  backgroundColor,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || colors.surface,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

