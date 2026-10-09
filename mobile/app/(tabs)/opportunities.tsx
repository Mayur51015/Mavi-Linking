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
import { Job, PlacementDrive } from '../../src/types/models';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Badge } from '../../src/components/common/Badge';
import { Input } from '../../src/components/common/Input';
import { TabsSegment } from '../../src/components/common/TabsSegment';
import { EmptyState } from '../../src/components/common/EmptyState';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function OpportunitiesScreen() {
  const { role, user } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      if (role === 'recruiter') {
        const res = await api.get('/jobs/recruiter');
        if (res.data?.success) {
          setJobs(res.data.data || []);
        }
      } else {
        // Student, Teacher, Admin
        const [jobsRes, drivesRes] = await Promise.allSettled([
          api.get('/jobs'),
          api.get('/teacher/drives'),
        ]);

        if (jobsRes.status === 'fulfilled' && jobsRes.value.data?.success) {
          setJobs(jobsRes.value.data.data || []);
        }
        if (drivesRes.status === 'fulfilled' && drivesRes.value.data?.success) {
          setDrives(drivesRes.value.data.data || []);
        }
      }
    } catch (err: any) {
      console.warn('[Opportunities] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpportunities();
  };

  const handleApply = async (job: Job) => {
    if (job.hasApplied) {
      Alert.alert('Application', 'You have already submitted an application for this opportunity.');
      return;
    }

    Alert.alert(
      'Apply to ' + job.title,
      `Are you sure you want to submit your verified profile to ${job.company || job.companyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Application',
          onPress: async () => {
            setApplyingJobId(job._id);
            try {
              const res = await api.post(`/jobs/${job._id}/apply`);
              if (res.data?.success) {
                Alert.alert('Success', 'Your application has been received by the recruiter!');
                setJobs((prev) =>
                  prev.map((j) => (j._id === job._id ? { ...j, hasApplied: true } : j))
                );
              }
            } catch (err: any) {
              Alert.alert('Application Failed', err.message || 'Could not apply at this time.');
            } finally {
              setApplyingJobId(null);
            }
          },
        },
      ]
    );
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.company || job.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'fulltime') return job.jobType === 'Full-time';
    if (activeTab === 'internship') return job.jobType === 'Internship';
    return true;
  });

  const renderJobItem = ({ item }: { item: Job }) => {
    const isApplying = applyingJobId === item._id;

    return (
      <Card padding="md" style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.companyName}>{item.company || item.companyName || 'Partner Employer'}</Text>
          </View>
          <Badge
            label={item.jobType || 'Full-time'}
            variant={item.jobType === 'Internship' ? 'purple' : 'primary'}
            size="sm"
          />
        </View>

        <View style={styles.jobMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.location || 'Remote / Hybrid'}</Text>
          </View>
          {item.stipend || item.salary ? (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {item.stipend || `${item.salary?.min || ''} - ${item.salary?.max || ''} LPA`}
              </Text>
            </View>
          ) : null}
          {item.minCgpa ? (
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>Min CGPA: {item.minCgpa}</Text>
            </View>
          ) : null}
        </View>

        {item.description ? (
          <Text style={styles.jobDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {role === 'student' && (
          <View style={styles.jobFooter}>
            <Button
              title={item.hasApplied ? 'Applied' : 'Apply Now'}
              onPress={() => handleApply(item)}
              variant={item.hasApplied ? 'secondary' : 'primary'}
              size="sm"
              loading={isApplying}
              disabled={item.hasApplied}
              style={styles.applyBtn}
            />
          </View>
        )}

        {role === 'recruiter' && (
          <View style={styles.jobFooter}>
            <Text style={styles.applicantsBadge}>
              {item.applicantsCount ?? 0} applicants received
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topContainer}>
        <Text style={styles.screenTitle}>
          {role === 'recruiter' ? 'Managed Opportunities' : 'Career Opportunities'}
        </Text>
        <Text style={styles.screenSubtitle}>
          {role === 'recruiter'
            ? 'Review and manage your active job drives'
            : 'Explore verified company drives and internships'}
        </Text>

        {/* Search Input */}
        <Input
          placeholder="Search by role or company..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
          containerStyle={styles.searchBar}
        />

        {/* Filter Segment */}
        <TabsSegment
          tabs={[
            { id: 'all', label: 'All Openings', badgeCount: jobs.length },
            { id: 'fulltime', label: 'Full-time' },
            { id: 'internship', label: 'Internships' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item._id}
        renderItem={renderJobItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="briefcase-outline"
              title="No Opportunities Found"
              description="There are currently no active openings matching your search criteria."
              actionTitle="Clear Search"
              onAction={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
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
  searchBar: {
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  jobCard: {
    marginBottom: spacing.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  jobHeaderLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  jobTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  jobMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  jobDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    lineHeight: typography.lineHeight.xs,
    marginTop: 2,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  applyBtn: {
    minWidth: 100,
  },
  applicantsBadge: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
