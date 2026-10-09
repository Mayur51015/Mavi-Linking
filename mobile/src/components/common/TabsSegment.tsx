import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

export interface TabItem {
  id: string;
  label: string;
  badgeCount?: number;
}

interface TabsSegmentProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  scrollable?: boolean;
}

export const TabsSegment: React.FC<TabsSegmentProps> = ({
  tabs,
  activeTab,
  onChange,
  scrollable = false,
}) => {
  const content = (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, isActive && styles.activeTab]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
            {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
              <View style={[styles.badge, isActive && styles.activeBadge]}>
                <Text style={[styles.badgeText, isActive && styles.activeBadgeText]}>
                  {tab.badgeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  activeTab: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  activeBadge: {
    backgroundColor: colors.primaryLight,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  activeBadgeText: {
    color: colors.primary,
  },
});
