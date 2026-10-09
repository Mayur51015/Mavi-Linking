import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import { colors, spacing, typography } from '../../constants/theme';
import { CanonicalRole } from '../../types/models';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  role?: CanonicalRole;
  unreadCount?: number;
  environmentLabel?: string;
  onNotificationPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'EduTalentX',
  subtitle,
  role,
  unreadCount = 0,
  environmentLabel,
  onNotificationPress,
  rightAction,
}) => {
  const router = useRouter();

  const handleNotifications = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/(tabs)/notifications' as any);
    }
  };

  const getRoleBadgeVariant = (r?: CanonicalRole) => {
    switch (r) {
      case 'owner':
      case 'super_admin':
        return 'purple';
      case 'recruiter':
        return 'warning';
      case 'teacher':
        return 'success';
      case 'institution_admin':
      case 'department_admin':
        return 'info';
      case 'student':
      default:
        return 'primary';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {role && (
            <Badge
              label={role.replace('_', ' ')}
              variant={getRoleBadgeVariant(role)}
              size="sm"
              style={styles.roleBadge}
            />
          )}
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {environmentLabel && (
          <Text style={styles.envTag}>{environmentLabel}</Text>
        )}
      </View>

      <View style={styles.right}>
        {rightAction ? (
          rightAction
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotifications}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notificationDot}>
                <Text style={styles.dotText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  roleBadge: {
    marginLeft: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  envTag: {
    fontSize: 10,
    color: colors.textSubtle,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dotText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
  },
});
