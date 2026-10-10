import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<'user' | 'teacher' | 'recruiter'>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prn, setPrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        prn: role === 'user' ? prn.trim() : undefined,
      });
      // AuthGate will redirect on success
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          <Text style={styles.backText}>Sign In</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join EduTalentX placement & intelligence platform</Text>
        </View>

        {/* Role Selector Tabs */}
        <View style={styles.roleTabsContainer}>
          <TouchableOpacity
            style={[styles.roleTab, role === 'user' && styles.roleTabActive]}
            onPress={() => setRole('user')}
          >
            <Text style={[styles.roleTabText, role === 'user' && styles.roleTabTextActive]}>
              Student
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'teacher' && styles.roleTabActive]}
            onPress={() => setRole('teacher')}
          >
            <Text style={[styles.roleTabText, role === 'teacher' && styles.roleTabTextActive]}>
              Faculty
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTab, role === 'recruiter' && styles.roleTabActive]}
            onPress={() => setRole('recruiter')}
          >
            <Text style={[styles.roleTabText, role === 'recruiter' && styles.roleTabTextActive]}>
              Recruiter
            </Text>
          </TouchableOpacity>
        </View>

        <Card padding="lg" style={styles.formCard}>
          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Input
            label="Full Name *"
            placeholder="e.g. John Doe"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Email Address *"
            placeholder="e.g. name@university.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {role === 'user' && (
            <Input
              label="Permanent Registration Number (PRN)"
              placeholder="e.g. PRN-2024-00123"
              value={prn}
              onChangeText={setPrn}
              autoCapitalize="characters"
              hint="Required for institutional verification & placement drives"
            />
          )}

          <Input
            label="Password *"
            placeholder="Min. 6 chars with uppercase & number"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />
        </Card>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 6,
  },
  backText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  roleTabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  roleTabText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
  },
  roleTabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  formCard: {
    width: '100%',
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
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
