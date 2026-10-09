import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/api/client';
import { Pipeline, PipelineStage } from '../../src/types/models';
import { Card } from '../../src/components/common/Card';
import { Badge, getStageBadgeVariant } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { TabsSegment } from '../../src/components/common/TabsSegment';
import { EmptyState } from '../../src/components/common/EmptyState';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

const STAGES: PipelineStage[] = ['applied', 'screening', 'interview', 'offer', 'placed'];

export default function ApplicationsScreen() {
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPipelines = useCallback(async () => {
    try {
      const endpoint = role === 'recruiter' ? '/placement/pipeline' : '/placement/student/pipelines';
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setPipelines(res.data.data || []);
      }
    } catch (err: any) {
      console.warn('[Applications] Pipeline fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPipelines();
  };

  const handleUpdateStage = (pipelineId: string, currentStage: PipelineStage) => {
    const nextStageIndex = STAGES.indexOf(currentStage) + 1;
    if (nextStageIndex >= STAGES.length) {
      Alert.alert('Status', 'Candidate has reached the final stage (Placed).');
      return;
    }
    const nextStage = STAGES[nextStageIndex];

    Alert.alert(
      'Advance Stage',
      `Move this candidate to stage: "${nextStage.toUpperCase()}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Advance',
          onPress: async () => {
            try {
              const res = await api.put(`/placement/pipeline/${pipelineId}/status`, {
                stage: nextStage,
              });
              if (res.data?.success) {
                Alert.alert('Updated', `Stage updated to ${nextStage}`);
                setPipelines((prev) =>
                  prev.map((p) => (p._id === pipelineId ? { ...p, stage: nextStage } : p))
                );
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update stage.');
            }
          },
        },
      ]
    );
  };

  const filteredPipelines = pipelines.filter((p) => {
    if (activeTab === 'all') return true;
    return p.stage === activeTab;
  });

  const renderStageIndicator = (currentStage: PipelineStage) => {
    const currentIndex = STAGES.indexOf(currentStage);

    return (
      <View style={styles.stepperContainer}>
        {STAGES.map((s, idx) => {
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isPassed && styles.stepCirclePassed,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      isPassed && styles.stepNumberPassed,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                  numberOfLines={1}
                >
                  {s}
                </Text>
              </View>
              {idx < STAGES.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    idx < currentIndex && styles.stepConnectorPassed,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const renderPipelineItem = ({ item }: { item: Pipeline }) => {
    const jobTitle = typeof item.jobId === 'object' ? item.jobId.title : 'Placement Drive';
    const company = typeof item.jobId === 'object' ? (item.jobId.company || item.jobId.companyName) : 'Corporate Partner';
    const candidateName = typeof item.studentId === 'object' ? item.studentId.name : 'Candidate';

    return (
      <Card padding="md" style={styles.pipelineCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleBox}>
            <Text style={styles.primaryTitle}>
              {role === 'recruiter' ? candidateName : jobTitle}
            </Text>
            <Text style={styles.secondaryTitle}>
              {role === 'recruiter' ? `Role: ${jobTitle}` : company}
            </Text>
          </View>
          <Badge
            label={item.stage}
            variant={getStageBadgeVariant(item.stage)}
          />
        </View>

        {/* Visual Stepper */}
        {renderStageIndicator(item.stage)}

        {/* Scheduled Interview Details */}
        {item.interviewDetails?.scheduledDate && (
          <View style={styles.noticeBox}>
            <Ionicons name="calendar-outline" size={16} color={colors.purple} />
            <View style={styles.noticeTextContainer}>
              <Text style={styles.noticeTitle}>Interview Scheduled</Text>
              <Text style={styles.noticeDesc}>
                {new Date(item.interviewDetails.scheduledDate).toLocaleString()}
                {item.interviewDetails.round ? ` • Round: ${item.interviewDetails.round}` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Offer Details */}
        {item.offerDetails?.designation && (
          <View style={[styles.noticeBox, { backgroundColor: colors.successLight, borderColor: colors.successBorder }]}>
            <Ionicons name="trophy-outline" size={16} color={colors.success} />
            <View style={styles.noticeTextContainer}>
              <Text style={[styles.noticeTitle, { color: colors.success }]}>Offer Extended</Text>
              <Text style={styles.noticeDesc}>
                Designation: {item.offerDetails.designation}
                {item.offerDetails.salary ? ` • Package: ₹${item.offerDetails.salary} LPA` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Recruiter Action to Advance Stage */}
        {role === 'recruiter' && item.stage !== 'placed' && item.stage !== 'rejected' && (
          <View style={styles.recruiterActionRow}>
            <Button
              title="Advance Stage"
              onPress={() => handleUpdateStage(item._id, item.stage)}
              variant="outline"
              size="sm"
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topContainer}>
        <Text style={styles.screenTitle}>
          {role === 'recruiter' ? 'Recruitment Funnel' : 'Placement Pipeline'}
        </Text>
        <Text style={styles.screenSubtitle}>
          {role === 'recruiter'
            ? 'Track and progress candidates through evaluation rounds'
            : 'Live status of your submitted applications and interview rounds'}
        </Text>

        <TabsSegment
          tabs={[
            { id: 'all', label: 'All', badgeCount: pipelines.length },
            { id: 'screening', label: 'Screening' },
            { id: 'interview', label: 'Interview' },
            { id: 'offer', label: 'Offer' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <FlatList
        data={filteredPipelines}
        keyExtractor={(item) => item._id}
        renderItem={renderPipelineItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="layers-outline"
              title="No Applications in Pipeline"
              description={
                role === 'recruiter'
                  ? 'No candidates are currently at this stage of the pipeline.'
                  : 'You have not submitted any placement applications yet. Explore active opportunities to get started.'
              }
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
  screenTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pipelineCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerTitleBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  primaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  secondaryTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepItem: {
    alignItems: 'center',
    width: 50,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCirclePassed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: colors.primaryHover,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
  },
  stepNumberPassed: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginBottom: 16,
  },
  stepConnectorPassed: {
    backgroundColor: colors.primary,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purpleLight,
    borderColor: colors.purpleBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.purple,
  },
  noticeDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  recruiterActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
