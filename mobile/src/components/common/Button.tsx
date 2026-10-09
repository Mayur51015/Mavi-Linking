import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#ffffff' : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              isDisabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.minHeight,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.borderDark,
    borderWidth: 1,
  },
  destructive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  // Text Colors
  text_primary: {
    color: '#ffffff',
  },
  text_secondary: {
    color: colors.textPrimary,
  },
  text_outline: {
    color: colors.textPrimary,
  },
  text_destructive: {
    color: '#ffffff',
  },
  text_ghost: {
    color: colors.primary,
  },
  // Sizes
  size_sm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.base,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 50,
  },
  // Text Sizes
  textSize_sm: {
    fontSize: typography.fontSize.sm,
  },
  textSize_md: {
    fontSize: typography.fontSize.base,
  },
  textSize_lg: {
    fontSize: typography.fontSize.md,
  },
  // Disabled
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: colors.textSubtle,
  },
});
