import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'purple'
  | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  size = 'md',
}) => {
  return (
    <View style={[styles.base, styles[variant], size === 'sm' && styles.size_sm, style]}>
      <Text
        style={[
          styles.text,
          styles[`text_${variant}`],
          size === 'sm' && styles.textSize_sm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// Helper to determine badge variant based on pipeline stage
export const getStageBadgeVariant = (stage: string): BadgeVariant => {
  switch (stage.toLowerCase()) {
    case 'applied':
      return 'info';
    case 'screening':
      return 'warning';
    case 'interview':
      return 'purple';
    case 'offer':
    case 'placed':
      return 'success';
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
};

// Helper for user account status badge
export const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING_ADMIN_APPROVAL':
    case 'PENDING_VERIFICATION':
      return 'warning';
    case 'SUSPENDED':
    case 'REJECTED':
      return 'danger';
    default:
      return 'neutral';
  }
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  size_sm: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  textSize_sm: {
    fontSize: 10,
  },
  // Variant styles
  primary: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  text_primary: {
    color: colors.primary,
  },
  success: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  text_success: {
    color: colors.success,
  },
  warning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningBorder,
  },
  text_warning: {
    color: colors.warning,
  },
  danger: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  text_danger: {
    color: colors.danger,
  },
  purple: {
    backgroundColor: colors.purpleLight,
    borderColor: colors.purpleBorder,
  },
  text_purple: {
    color: colors.purple,
  },
  info: {
    backgroundColor: colors.infoLight,
    borderColor: colors.infoBorder,
  },
  text_info: {
    color: colors.info,
  },
  neutral: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  text_neutral: {
    color: colors.textSecondary,
  },
});
