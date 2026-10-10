import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

const SIMULATED_SKILLS = [
  'Docker',
  'Kubernetes',
  'GraphQL',
  'AWS',
  'Redis',
  'PostgreSQL',
  'TypeScript',
  'Microservices',
];

export default function CareerLabScreen() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [simulateProject, setSimulateProject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/career-lab/simulate', {
        addedSkills: selectedSkills,
        addedProjects: simulateProject
          ? [{ title: 'Full Stack Production App', technologies: selectedSkills }]
          : [],
      });
      if (res.data?.success) {
        setSimulationResult(res.data.data);
      } else {
        // Fallback mock simulation response if offline
        const baseline = 75;
        const boost = selectedSkills.length * 4 + (simulateProject ? 10 : 0);
        setSimulationResult({
          currentScore: baseline,
          simulatedScore: Math.min(100, baseline + boost),
          estimatedImpact: boost,
          addedSkills: selectedSkills,
        });
      }
    } catch {
      // Fallback deterministic calculation
      const baseline = 75;
      const boost = selectedSkills.length * 4 + (simulateProject ? 10 : 0);
      setSimulationResult({
        currentScore: baseline,
        simulatedScore: Math.min(100, baseline + boost),
        estimatedImpact: boost,
        addedSkills: selectedSkills,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card padding="md" style={styles.introCard}>
        <View style={styles.introHeader}>
          <Ionicons name="flask-outline" size={24} color={colors.purple} />
          <Text style={styles.introTitle}>What-If Career Lab</Text>
        </View>
        <Text style={styles.introText}>
          Simulate how mastering industry skills and shipping production projects will boost your verified placement score and interview shortlist rate.
        </Text>
      </Card>

      {/* Select Skills to Simulate */}
      <Text style={styles.sectionTitle}>1. Select Skills to Acquire</Text>
      <View style={styles.skillsGrid}>
        {SIMULATED_SKILLS.map((skill) => {
          const isSelected = selectedSkills.includes(skill);
          return (
            <TouchableOpacity
              key={skill}
              style={[styles.skillChip, isSelected && styles.skillChipActive]}
              onPress={() => toggleSkill(skill)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={16}
                color={isSelected ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.skillText, isSelected && styles.skillTextActive]}>
                {skill}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Simulate Project */}
      <Text style={styles.sectionTitle}>2. Project Portfolio Expansion</Text>
      <TouchableOpacity
        style={[styles.projectToggle, simulateProject && styles.projectToggleActive]}
        onPress={() => setSimulateProject((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={simulateProject ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={simulateProject ? colors.primary : colors.textMuted}
        />
        <View style={styles.projectTextWrap}>
          <Text style={styles.projectTitle}>Simulate Production Microservices Project</Text>
          <Text style={styles.projectSub}>
            Includes full CI/CD deployment and architectural documentation
          </Text>
        </View>
      </TouchableOpacity>

      <Button
        title="Run Career Simulation"
        onPress={runSimulation}
        loading={loading}
        size="lg"
        style={styles.simulateBtn}
      />

      {/* Simulation Result Box */}
      {simulationResult && (
        <Card padding="lg" style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Simulation Results</Text>
            <Badge
              label={`+${simulationResult.estimatedImpact ?? 0} pts boost`}
              variant="success"
              size="md"
            />
          </View>

          <View style={styles.scoreComparisonRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.compLabel}>Current Score</Text>
              <Text style={styles.compValue}>{simulationResult.currentScore ?? 75}%</Text>
            </View>

            <Ionicons name="arrow-forward" size={24} color={colors.primary} />

            <View style={styles.scoreItem}>
              <Text style={styles.compLabel}>Simulated Score</Text>
              <Text style={[styles.compValue, { color: colors.success }]}>
                {simulationResult.simulatedScore ?? 85}%
              </Text>
            </View>
          </View>

          <Text style={styles.outcomeNote}>
            By acquiring {selectedSkills.length} selected skills
            {simulateProject ? ' and 1 production project' : ''}, your placement eligibility would jump from Tier 2 to Tier 1 candidate bracket.
          </Text>
        </Card>
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
  introCard: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  introTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  introText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    lineHeight: typography.lineHeight.xs,
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
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  skillText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  skillTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  projectToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  projectToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  projectTextWrap: {
    flex: 1,
  },
  projectTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  projectSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  simulateBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  resultCard: {
    marginTop: spacing.md,
    borderColor: colors.primaryBorder,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scoreComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  scoreItem: {
    alignItems: 'center',
  },
  compLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  compValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  outcomeNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.xs,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
