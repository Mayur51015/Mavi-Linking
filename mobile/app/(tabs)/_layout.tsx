import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../src/constants/theme';
import { useNotifications } from '../../src/context/NotificationContext';
import { useAuth } from '../../src/context/AuthContext';

export default function TabLayout() {
  const { unreadCount } = useNotifications();
  const { role } = useAuth();

  const getOpportunitiesTabTitle = () => {
    if (role === 'recruiter') return 'My Jobs';
    if (role === 'teacher') return 'Drives';
    return 'Opportunities';
  };

  const getApplicationsTabTitle = () => {
    if (role === 'recruiter') return 'Candidates';
    if (role === 'teacher') return 'Students';
    return 'Pipeline';
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: getOpportunitiesTabTitle(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: getApplicationsTabTitle(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            fontSize: 10,
            fontWeight: 'bold',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
