import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function CareerMatchScreen() {
  const [matchData, setMatchData] = useState<any>(null);
  const [supportedRoles, setSupportedRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCareerMatch = useCallback(async (targetRole?: string) => {
    try {
      const rolesRes = await api.get('/career-match/roles').catch(() => null);
      if (rolesRes?.data?.data) {
        const rolesList = Array.isArray(rolesRes.data.data) ? rolesRes.data.data : [];
        setSupportedRoles(rolesList);
      }

      const matchUrl = targetRole ? `/career-match/role/${encodeURIComponent(targetRole)}` : '/career-match';
      const res = await api.get(matchUrl);
      if (res.data?.success) {
        setMatchData(res.data.data);
        if (res.data.data.targetRole) {
          setSelectedRole(res.data.data.targetRole);
        }
      }
    } catch (err: any) {
      console.warn('[CareerMatch] Error fetching match:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCareerMatch();
  }, [fetchCareerMatch]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCareerMatch(selectedRole);
  };

  const handleSelectRole = async (r: string) => {
    setSelectedRole(r);
    setLoading(true);
    await fetchCareerMatch(r);
  };

  const score = matchData?.matchScore ?? 75;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Target Role Selector Pills */}
      <Text style={styles.sectionTitle}>Target Professional Role</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rolesRow}
      >
        {(supportedRoles.length > 0
          ? supportedRoles
          : ['Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'DevOps Specialist', 'Data Scientist']
        ).map((r) => {
          const isSelected = selectedRole.toLowerCase() === r.toLowerCase();
          return (
            <TouchableOpacity
              key={r}
              style={[styles.roleChip, isSelected && styles.roleChipActive]}
              onPress={() => handleSelectRole(r)}
            >
              <Text style={[styles.roleChipText, isSelected && styles.roleChipTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Computing deterministic match...</Text>
        </View>
      ) : (
        <>
          {/* Match Score Card */}
          <Card padding="lg" style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{score}%</Text>
                <Text style={styles.scoreLabel}>Match</Text>
              </View>

              <View style={styles.scoreMeta}>
                <Text style={styles.targetRoleTitle}>
                  {matchData?.targetRole || selectedRole || 'Full Stack Developer'}
                </Text>
                <Badge
                  label={score >= 80 ? 'High Fit' : score >= 60 ? 'Moderate Fit' : 'Skill Gaps Present'}
                  variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}
                  size="sm"
                />
                <Text style={styles.evidenceCount}>
                  Based on verified GitHub commits, LeetCode data, and coursework.
                </Text>
              </View>
            </View>
          </Card>

          {/* Strong Skills with Evidence */}
          <Text style={styles.sectionTitle}>Strong Validated Skills</Text>
          {matchData?.strongSkills && matchData.strongSkills.length > 0 ? (
            matchData.strongSkills.map((item: any, idx: number) => (
              <Card key={idx} padding="md" style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.itemTitle}>{item.skill || item.name}</Text>
                  </View>
                  <Badge label="Validated" variant="success" size="sm" />
                </View>
                {item.evidence ? (
                  <Text style={styles.evidenceText}>Evidence: {item.evidence}</Text>
                ) : null}
              </Card>
            ))
          ) : (
            <Card padding="md" style={styles.itemCard}>
              <Text style={styles.emptyNote}>
                Connect your GitHub or LeetCode accounts to automatically validate key skills.
              </Text>
            </Card>
          )}

          {/* Skill Gaps & Recommendations */}
          <Text style={styles.sectionTitle}>Identified Skill Gaps</Text>
          {matchData?.skillGaps && matchData.skillGaps.length > 0 ? (
            matchData.skillGaps.map((item: any, idx: number) => (
              <Card key={idx} padding="md" style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <Ionicons name="alert-circle" size={18} color={colors.warning} />
                    <Text style={styles.itemTitle}>{item.skill || item.name}</Text>
                  </View>
                  <Badge
                    label={item.importance || 'Recommended'}
                    variant={item.importance === 'high' ? 'danger' : 'warning'}
                    size="sm"
                  />
                </View>
                {item.recommendation ? (
                  <Text style={styles.recommendationText}>
                    Recommendation: {item.recommendation}
                  </Text>
                ) : null}
              </Card>
            ))
          ) : (
            <Card padding="md" style={styles.itemCard}>
              <Text style={styles.emptyNote}>
                No critical skill gaps identified for this role! Your profile satisfies core requirements.
              </Text>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  roleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  roleChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  roleChipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  loaderBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  scoreCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  scoreMeta: {
    flex: 1,
    gap: 4,
  },
  targetRoleTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  evidenceCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    lineHeight: typography.lineHeight.xs,
    marginTop: 2,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  evidenceText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.xs,
  },
  recommendationText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.xs,
  },
  emptyNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
