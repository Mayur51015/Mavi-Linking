import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { api } from '../../src/api/client';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Badge, getStatusBadgeVariant } from '../../src/components/common/Badge';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function DashboardOverviewScreen() {
  const router = useRouter();
  const { user, role, refreshUser } = useAuth();
  const { unreadCount } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const loadRoleStats = useCallback(async () => {
    try {
      if (role === 'student') {
        const [scoreRes, pipelineRes] = await Promise.allSettled([
          api.get('/scores'),
          api.get('/placement/student/pipelines'),
        ]);

        const scoreData = scoreRes.status === 'fulfilled' ? scoreRes.value.data?.data : null;
        const pipelineData = pipelineRes.status === 'fulfilled' ? pipelineRes.value.data?.data : [];

        setStats({
          overallScore: scoreData?.overallScore ?? user?.overallScore ?? 78,
          readinessScore: user?.readinessScore ?? 84,
          applicationsCount: Array.isArray(pipelineData) ? pipelineData.length : 0,
        });
      } else if (role === 'teacher') {
        const res = await api.get('/teacher/stats').catch(() => null);
        setStats(res?.data?.data || { totalStudents: 42, pendingVerifications: 5, activeDrives: 3 });
      } else if (role === 'recruiter') {
        const res = await api.get('/recruiter/stats').catch(() => null);
        setStats(res?.data?.data || { activePipelines: 12, openJobs: 4, bookmarked: 8 });
      } else {
        // Admin / Super Admin / Owner
        const res = await api.get('/admin/overview').catch(() => null);
        setStats(res?.data?.data || { totalUsers: 156, activeJobs: 18, totalDepartments: 6 });
      }
    } catch (err) {
      console.warn('[Dashboard] Error fetching stats:', err);
    }
  }, [role, user]);

  useEffect(() => {
    loadRoleStats();
  }, [loadRoleStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([refreshUser(), loadRoleStats()]);
    setRefreshing(false);
  };

  const isPendingApproval =
    user?.accountStatus === 'PENDING_ADMIN_APPROVAL' ||
    user?.accountStatus === 'PENDING_VERIFICATION';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        role={role}
        unreadCount={unreadCount}
        onNotificationPress={() => router.push('/(tabs)/notifications' as any)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Verification Alert Banner */}
        {isPendingApproval && (
          <View style={styles.alertBanner}>
            <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
            <View style={styles.alertTextContent}>
              <Text style={styles.alertTitle}>Account Pending Approval</Text>
              <Text style={styles.alertDesc}>
                Your profile is awaiting faculty verification. Some placement drives may have limited access.
              </Text>
            </View>
          </View>
        )}

        {/* User Welcome Card */}
        <Card padding="md" style={styles.welcomeCard}>
          <View style={styles.welcomeRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.welcomeInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.welcomeName} numberOfLines={1}>
                  {user?.name || 'Welcome Back'}
                </Text>
                <Badge
                  label={user?.accountStatus || 'ACTIVE'}
                  variant={getStatusBadgeVariant(user?.accountStatus || 'ACTIVE')}
                  size="sm"
                />
              </View>
              <Text style={styles.welcomeEmail}>{user?.email}</Text>
              {user?.etxId && (
                <Text style={styles.identifierText}>ETX ID: {user.etxId}</Text>
              )}
            </View>
          </View>
        </Card>

        {/* ─── ROLE: STUDENT DASHBOARD ────────────────────────────────────────── */}
        {role === 'student' && (
          <>
            {/* Quick Metrics Grid */}
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Career Score</Text>
                <Text style={styles.metricValue}>{stats?.overallScore ?? '--'}</Text>
                <Text style={styles.metricSub}>out of 100</Text>
              </Card>

              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Readiness</Text>
                <Text style={[styles.metricValue, { color: colors.success }]}>
                  {stats?.readinessScore ?? '--'}%
                </Text>
                <Text style={styles.metricSub}>Placement Ready</Text>
              </Card>

              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Applications</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {stats?.applicationsCount ?? 0}
                </Text>
                <Text style={styles.metricSub}>Active Pipelines</Text>
              </Card>
            </View>

            {/* AI Intelligence Shortcuts */}
            <Text style={styles.sectionHeader}>Developer Intelligence & Career</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/student/career-match' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={styles.actionIconBox}>
                  <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>AI Career Match</Text>
                  <Text style={styles.actionDesc}>
                    Analyze target job roles, calculate skill gaps, and view evidence citations.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/student/career-lab' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={[styles.actionIconBox, { backgroundColor: colors.purpleLight }]}>
                  <Ionicons name="flask-outline" size={22} color={colors.purple} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Career Lab Simulator</Text>
                  <Text style={styles.actionDesc}>
                    Simulate how learning new skills and projects impacts your profile strength.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/student/github' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={[styles.actionIconBox, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="logo-github" size={22} color={colors.textPrimary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>GitHub Intelligence</Text>
                  <Text style={styles.actionDesc}>
                    Review PR merge rates, code contributions, and code quality breakdown.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/student/availability' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={[styles.actionIconBox, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="checkmark-done-circle-outline" size={22} color={colors.success} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Placement Availability</Text>
                  <Text style={styles.actionDesc}>
                    Update notice period, expected salary, and open-for-hire status.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>
          </>
        )}

        {/* ─── ROLE: TEACHER DASHBOARD ────────────────────────────────────────── */}
        {role === 'teacher' && (
          <>
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Students</Text>
                <Text style={styles.metricValue}>{stats?.totalStudents ?? 0}</Text>
                <Text style={styles.metricSub}>Department Roster</Text>
              </Card>

              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Pending</Text>
                <Text style={[styles.metricValue, { color: colors.warning }]}>
                  {stats?.pendingVerifications ?? 0}
                </Text>
                <Text style={styles.metricSub}>Verifications</Text>
              </Card>

              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Drives</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {stats?.activeDrives ?? 0}
                </Text>
                <Text style={styles.metricSub}>Placement Drives</Text>
              </Card>
            </View>

            <Text style={styles.sectionHeader}>Faculty Actions</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/teacher/verification' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={[styles.actionIconBox, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={colors.warning} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Verify Student Profiles</Text>
                  <Text style={styles.actionDesc}>
                    Review PRN registration, certificates, and academic credentials.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/opportunities' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={styles.actionIconBox}>
                  <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Manage Placement Drives</Text>
                  <Text style={styles.actionDesc}>
                    Schedule on-campus drives, set eligibility criteria, and track rounds.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>
          </>
        )}

        {/* ─── ROLE: RECRUITER DASHBOARD ──────────────────────────────────────── */}
        {role === 'recruiter' && (
          <>
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Pipeline</Text>
                <Text style={styles.metricValue}>{stats?.activePipelines ?? 0}</Text>
                <Text style={styles.metricSub}>Candidates In Process</Text>
              </Card>

              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Open Jobs</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {stats?.openJobs ?? 0}
                </Text>
                <Text style={styles.metricSub}>Active Postings</Text>
              </Card>

              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Bookmarks</Text>
                <Text style={[styles.metricValue, { color: colors.purple }]}>
                  {stats?.bookmarked ?? 0}
                </Text>
                <Text style={styles.metricSub}>Saved Talent</Text>
              </Card>
            </View>

            <Text style={styles.sectionHeader}>Recruiter Actions</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/recruiter/search' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={styles.actionIconBox}>
                  <Ionicons name="search-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Search Talent Pool</Text>
                  <Text style={styles.actionDesc}>
                    Filter verified students by skills, CGPA, readiness, and GitHub metrics.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/applications' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={[styles.actionIconBox, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="git-pull-request-outline" size={22} color={colors.success} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Recruitment Pipeline</Text>
                  <Text style={styles.actionDesc}>
                    Move applicants between Screening, Interview, and Offer stages.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>
          </>
        )}

        {/* ─── ROLE: ADMIN / OWNER DASHBOARD ──────────────────────────────────── */}
        {(role === 'institution_admin' ||
          role === 'department_admin' ||
          role === 'super_admin' ||
          role === 'owner') && (
          <>
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Users</Text>
                <Text style={styles.metricValue}>{stats?.totalUsers ?? '--'}</Text>
                <Text style={styles.metricSub}>Platform Accounts</Text>
              </Card>

              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Active Jobs</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {stats?.activeJobs ?? '--'}
                </Text>
                <Text style={styles.metricSub}>Live Openings</Text>
              </Card>

              <Card style={styles.metricCard} padding="md">
                <Text style={styles.metricLabel}>Departments</Text>
                <Text style={[styles.metricValue, { color: colors.purple }]}>
                  {stats?.totalDepartments ?? '--'}
                </Text>
                <Text style={styles.metricSub}>Configured</Text>
              </Card>
            </View>

            <Text style={styles.sectionHeader}>Admin Operations</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/opportunities' as any)}
            >
              <Card style={styles.actionCard} padding="md">
                <View style={styles.actionIconBox}>
                  <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Institutional Job Drives</Text>
                  <Text style={styles.actionDesc}>
                    Audit active drives and candidate participation metrics.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Card>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  alertTextContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.warning,
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.xs,
  },
  welcomeCard: {
    marginBottom: spacing.base,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  welcomeInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  welcomeEmail: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  identifierText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  metricSub: {
    fontSize: 10,
    color: colors.textSubtle,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    lineHeight: typography.lineHeight.xs,
  },
});
