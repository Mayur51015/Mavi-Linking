import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { api } from '../../src/api/client';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { colors, spacing, typography } from '../../src/constants/theme';

export default function AvailabilityScreen() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [expectedSalary, setExpectedSalary] = useState('8 - 12 LPA');
  const [noticePeriod, setNoticePeriod] = useState('Immediate / Final Year');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await api.get('/placement/availability');
        if (res.data?.success && res.data.data) {
          const d = res.data.data;
          if (typeof d.isAvailableForPlacement === 'boolean') {
            setIsAvailable(d.isAvailableForPlacement);
          }
          if (d.targetRole) setTargetRole(d.targetRole);
          if (d.expectedSalary) setExpectedSalary(d.expectedSalary);
          if (d.noticePeriod) setNoticePeriod(d.noticePeriod);
        }
      } catch {
        // Fallback to local defaults
      }
    };
    fetchAvailability();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/placement/availability', {
        isAvailableForPlacement: isAvailable,
        targetRole: targetRole.trim(),
        expectedSalary: expectedSalary.trim(),
        noticePeriod: noticePeriod.trim(),
      });
      if (res.data?.success) {
        Alert.alert('Saved', 'Your placement availability settings have been updated.');
      }
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Availability preferences saved locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card padding="md" style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleTitle}>Open for Placement & Hiring</Text>
            <Text style={styles.toggleDesc}>
              Make your verified profile visible to campus recruiters and partner companies.
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: colors.borderDark, true: colors.primary }}
          />
        </View>
      </Card>

      <Card padding="lg" style={styles.formCard}>
        <Input
          label="Target Career Goal / Role"
          placeholder="e.g. Backend Engineer / Cloud Architect"
          value={targetRole}
          onChangeText={setTargetRole}
        />

        <Input
          label="Expected Annual CTC"
          placeholder="e.g. 10 - 15 LPA"
          value={expectedSalary}
          onChangeText={setExpectedSalary}
        />

        <Input
          label="Availability / Notice Period"
          placeholder="e.g. Immediate / 2026 Batch"
          value={noticePeriod}
          onChangeText={setNoticePeriod}
        />

        <Button
          title="Save Availability Preferences"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={styles.saveBtn}
        />
      </Card>
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
  toggleCard: {
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  toggleDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: typography.lineHeight.xs,
  },
  formCard: {
    width: '100%',
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
});
