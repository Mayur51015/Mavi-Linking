import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../src/context/NotificationContext';
import { AppNotification, NotificationCategory } from '../../src/types/models';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { TabsSegment } from '../../src/components/common/TabsSegment';
import { EmptyState } from '../../src/components/common/EmptyState';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications({ category: activeCategory });
  }, [fetchNotifications, activeCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications({ category: activeCategory });
    setRefreshing(false);
  };

  const filtered = notifications.filter((item) => {
    if (activeCategory === 'unread') return !item.isRead;
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'placement':
        return 'briefcase-outline';
      case 'career':
        return 'sparkles-outline';
      case 'institution':
        return 'school-outline';
      case 'account':
        return 'person-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (!item.isRead) markAsRead(item._id);
        }}
      >
        <Card
          padding="md"
          style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
        >
          <View style={styles.notifRow}>
            <View
              style={[
                styles.iconContainer,
                !item.isRead ? styles.iconUnread : styles.iconRead,
              ]}
            >
              <Ionicons
                name={getCategoryIcon(item.category)}
                size={18}
                color={!item.isRead ? colors.primary : colors.textMuted}
              />
            </View>

            <View style={styles.textContent}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.notifMessage} numberOfLines={3}>
                {item.message}
              </Text>

              <View style={styles.footerRow}>
                <Badge label={item.category || 'general'} size="sm" variant="neutral" />
                <Text style={styles.timeText}>
                  {new Date(item.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topContainer}>
        <View style={styles.titleRowTop}>
          <View>
            <Text style={styles.screenTitle}>Notification Center</Text>
            <Text style={styles.screenSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <Button
              title="Mark all read"
              onPress={markAllAsRead}
              variant="ghost"
              size="sm"
            />
          )}
        </View>

        <TabsSegment
          tabs={[
            { id: 'all', label: 'All', badgeCount: notifications.length },
            { id: 'unread', label: 'Unread', badgeCount: unreadCount },
            { id: 'placement', label: 'Placements' },
            { id: 'career', label: 'Career' },
            { id: 'system', label: 'System' },
          ]}
          activeTab={activeCategory}
          onChange={(tab) => setActiveCategory(tab as NotificationCategory)}
          scrollable
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="notifications-off-outline"
              title="No Notifications"
              description="You have no notifications in this category."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  titleRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notifCard: {
    marginBottom: spacing.sm,
  },
  notifCardUnread: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconUnread: {
    backgroundColor: colors.primaryLight,
  },
  iconRead: {
    backgroundColor: colors.surfaceSubtle,
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  notifTitleUnread: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.xs,
  },
  notifMessage: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    lineHeight: typography.lineHeight.xs,
    marginTop: 3,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: colors.textSubtle,
  },
});
