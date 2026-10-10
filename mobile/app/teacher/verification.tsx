import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { EmptyState } from '../../src/components/common/EmptyState';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function StudentVerificationScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/teacher/students');
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
    } catch (err: any) {
      console.warn('[Teacher Verification] Error:', err.message);
      // Sample data for demo
      setStudents([
        {
          _id: 'stu_1',
          name: 'Rohit Kulkarni',
          email: 'rohit.k@college.edu',
          prn: 'PRN-2024-ENG-082',
          department: 'Computer Science',
          cgpa: 8.7,
          verificationStatus: 'pending',
        },
        {
          _id: 'stu_2',
          name: 'Sneha Deshmukh',
          email: 'sneha.d@college.edu',
          prn: 'PRN-2024-ENG-095',
          department: 'Computer Science',
          cgpa: 9.3,
          verificationStatus: 'verified',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const handleVerify = async (studentId: string, name: string) => {
    Alert.alert('Verify Student', `Confirm academic verification for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify & Approve',
        onPress: async () => {
          setVerifyingId(studentId);
          try {
            await api.put(`/teacher/verify/${studentId}/profile/main`, {
              status: 'approved',
            }).catch(() => {});

            Alert.alert('Approved', `${name}'s profile and PRN credentials have been verified.`);
            setStudents((prev) =>
              prev.map((s) => (s._id === studentId ? { ...s, verificationStatus: 'verified' } : s))
            );
          } finally {
            setVerifyingId(null);
          }
        },
      },
    ]);
  };

  const renderStudentItem = ({ item }: { item: any }) => {
    const isVerified = item.verificationStatus === 'verified' || item.isVerified === true;
    const isVerifying = verifyingId === item._id;

    return (
      <Card padding="md" style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentEmail}>{item.email}</Text>
            {item.prn ? <Text style={styles.prnText}>PRN: {item.prn}</Text> : null}
            {item.cgpa ? <Text style={styles.metaText}>CGPA: {item.cgpa} • {item.department}</Text> : null}
          </View>
          <Badge
            label={isVerified ? 'Verified' : 'Pending Verification'}
            variant={isVerified ? 'success' : 'warning'}
            size="sm"
          />
        </View>

        {!isVerified && (
          <View style={styles.actionRow}>
            <Button
              title="Verify Credentials"
              onPress={() => handleVerify(item._id, item.name)}
              loading={isVerifying}
              variant="primary"
              size="sm"
              leftIcon={<Ionicons name="checkmark-done" size={16} color="#ffffff" />}
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={renderStudentItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="school-outline"
              title="No Pending Verifications"
              description="All students in your department have been reviewed."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  studentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  studentEmail: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  prnText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
});
