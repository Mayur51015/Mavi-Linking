import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'subtle' | 'bordered';
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'base',
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'subtle' && styles.subtle,
        variant === 'bordered' && styles.bordered,
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    ...shadows.subtle,
  },
  subtle: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderLight,
  },
  bordered: {
    backgroundColor: colors.surface,
    borderColor: colors.borderDark,
    borderWidth: 1.5,
  },
});
