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
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { Badge } from '../../src/components/common/Badge';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { ENVIRONMENTS, EnvironmentType } from '../../src/config/environment';

export default function LoginScreen() {
  const router = useRouter();
  const { login, currentEnv, switchEnvironment, environmentLabel } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Environment switcher modal state
  const [envModalVisible, setEnvModalVisible] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your Email / ETX ID / PRN and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await login(identifier.trim(), password);
      // AuthGate automatically redirects to /(tabs)
    } catch (err: any) {
      console.warn('[LoginScreen] Login error:', err.message);
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Preset quick fill for test accounts
  const applyPreset = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleSelectEnv = async (env: EnvironmentType) => {
    if (env === 'custom') {
      if (!customUrl.trim()) {
        Alert.alert('Custom URL', 'Please enter a valid API URL (e.g., http://192.168.1.100:5000/api)');
        return;
      }
      await switchEnvironment('custom', customUrl.trim());
    } else {
      await switchEnvironment(env);
    }
    setEnvModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Environment Badge & Switcher Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.envButton}
            onPress={() => setEnvModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="server-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.envButtonText}>{environmentLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={28} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>EduTalentX</Text>
          <Text style={styles.brandSubtitle}>
            AI-Powered Career & Placement Intelligence
          </Text>
        </View>

        {/* Login Form Card */}
        <Card style={styles.formCard} padding="lg">
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formDescription}>
            Enter your Email, ETX ID, or PRN to continue
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Input
            label="Email / ETX ID / PRN"
            placeholder="e.g. ETX-2026-001 or email@domain.com"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password' as any)}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitButton}
            size="lg"
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Test / Demo Role Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.presetsHeader}>Quick Role Demo Presets</Text>
          <View style={styles.presetButtonsRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => applyPreset('student.test@example.com', 'StudentPass@123')}
            >
              <Badge label="Student" variant="primary" size="sm" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => applyPreset('recruiter@techcorp.com', 'RecruiterPass@123')}
            >
              <Badge label="Recruiter" variant="warning" size="sm" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => applyPreset('teacher@edutalentx.com', 'TeacherPass@123')}
            >
              <Badge label="Faculty" variant="success" size="sm" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => applyPreset('admin@edutalentx.com', 'AdminPass@123')}
            >
              <Badge label="Admin" variant="purple" size="sm" />
            </TouchableOpacity>
          </View>
        </View>

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
                <Text style={styles.modalTitle}>Select API Environment</Text>
                <TouchableOpacity onPress={() => setEnvModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Choose which server the mobile app connects to.
              </Text>

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
                <Text style={styles.customUrlLabel}>Custom Host / IP (e.g. http://192.168.1.50:5000/api):</Text>
                <Input
                  placeholder="http://<YOUR_IP>:5000/api"
                  value={customUrl}
                  onChangeText={setCustomUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  title="Use Custom URL"
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: spacing.sm,
  },
  envButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: 4,
  },
  envButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  formCard: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  formDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.base,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    lineHeight: typography.lineHeight.sm,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  forgotText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  submitButton: {
    marginTop: spacing.xs,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.base,
  },
  registerPrompt: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  registerLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  presetsSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  presetsHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingVertical: 2,
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
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.base,
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
