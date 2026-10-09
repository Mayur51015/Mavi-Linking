import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Card } from '../../src/components/common/Card';
import { Badge, getStatusBadgeVariant } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { ENVIRONMENTS, EnvironmentType } from '../../src/config/environment';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, role, logout, currentEnv, switchEnvironment, environmentLabel } = useAuth();

  const [envModalVisible, setEnvModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of EduTalentX?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleSelectEnv = async (env: EnvironmentType) => {
    if (env === 'custom') {
      if (!customUrl.trim()) {
        Alert.alert('Custom URL', 'Please enter a valid API URL (e.g. http://192.168.1.100:5000/api)');
        return;
      }
      await switchEnvironment('custom', customUrl.trim());
    } else {
      await switchEnvironment(env);
    }
    setEnvModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card Header */}
        <Card padding="lg" style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.nameSection}>
              <Text style={styles.userName}>{user?.name || 'Verified User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={role.replace('_', ' ')}
                  variant="primary"
                  size="sm"
                />
                <Badge
                  label={user?.accountStatus || 'ACTIVE'}
                  variant={getStatusBadgeVariant(user?.accountStatus || 'ACTIVE')}
                  size="sm"
                />
              </View>
            </View>
          </View>

          {/* Academic & Platform IDs */}
          <View style={styles.idsGrid}>
            {user?.etxId ? (
              <View style={styles.idBox}>
                <Text style={styles.idLabel}>ETX Identifier</Text>
                <Text style={styles.idValue}>{user.etxId}</Text>
              </View>
            ) : null}
            {user?.prn ? (
              <View style={styles.idBox}>
                <Text style={styles.idLabel}>University PRN</Text>
                <Text style={styles.idValue}>{user.prn}</Text>
              </View>
            ) : null}
            {user?.cgpa ? (
              <View style={styles.idBox}>
                <Text style={styles.idLabel}>Verified CGPA</Text>
                <Text style={styles.idValue}>{user.cgpa}</Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Feature Shortcuts (Students) */}
        {role === 'student' && (
          <>
            <Text style={styles.sectionTitle}>Career & Platform Tools</Text>
            <Card padding="none" style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/student/career-match' as any)}
              >
                <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
                <Text style={styles.menuItemText}>AI Career Match & Skill Gaps</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/student/career-lab' as any)}
              >
                <Ionicons name="flask-outline" size={20} color={colors.purple} />
                <Text style={styles.menuItemText}>Career Lab Simulator</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/student/github' as any)}
              >
                <Ionicons name="logo-github" size={20} color={colors.textPrimary} />
                <Text style={styles.menuItemText}>GitHub Intelligence Report</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/student/availability' as any)}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                <Text style={styles.menuItemText}>Placement Availability Status</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* System Settings & Environment */}
        <Text style={styles.sectionTitle}>Connection & App Settings</Text>
        <Card padding="none" style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setEnvModalVisible(true)}
          >
            <Ionicons name="server-outline" size={20} color={colors.textSecondary} />
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuItemText}>Backend Server Environment</Text>
              <Text style={styles.menuItemSub}>{environmentLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="destructive"
          style={styles.logoutBtn}
          leftIcon={<Ionicons name="log-out-outline" size={18} color="#ffffff" />}
        />

        <Text style={styles.versionFooter}>EduTalentX Mobile v1.0.0 (Android Native)</Text>

        {/* Environment Selector Modal */}
        <Modal
          visible={envModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEnvModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard} padding="lg">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change API Environment</Text>
                <TouchableOpacity onPress={() => setEnvModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {(Object.keys(ENVIRONMENTS) as EnvironmentType[]).map((key) => {
                const env = ENVIRONMENTS[key];
                const isSelected = currentEnv === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.envOption, isSelected && styles.envOptionSelected]}
                    onPress={() => handleSelectEnv(key)}
                  >
                    <View style={styles.envOptionContent}>
                      <Text style={[styles.envOptionLabel, isSelected && styles.envOptionLabelSelected]}>
                        {env.label}
                      </Text>
                      <Text style={styles.envOptionUrl}>{env.apiUrl}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}

              <View style={styles.customUrlBox}>
                <Text style={styles.customUrlLabel}>Custom Host / IP:</Text>
                <Input
                  placeholder="http://192.168.x.x:5000/api"
                  value={customUrl}
                  onChangeText={setCustomUrl}
                  autoCapitalize="none"
                />
                <Button
                  title="Connect to Custom URL"
                  onPress={() => handleSelectEnv('custom')}
                  variant="outline"
                  size="sm"
                />
              </View>
            </Card>
          </View>
        </Modal>
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
  profileCard: {
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  nameSection: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  idsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  idBox: {
    flex: 1,
  },
  idLabel: {
    fontSize: 10,
    color: colors.textSubtle,
    textTransform: 'uppercase',
  },
  idValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  menuCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  menuItemSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.base + 24,
  },
  logoutBtn: {
    marginTop: spacing.md,
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  envOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  envOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  envOptionContent: {
    flex: 1,
  },
  envOptionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  envOptionLabelSelected: {
    color: colors.primary,
  },
  envOptionUrl: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  customUrlBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  customUrlLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
