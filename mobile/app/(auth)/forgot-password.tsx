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
import { api } from '../../src/api/client';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your registered email address to receive password reset instructions.
          </Text>
        </View>

        <Card padding="lg" style={styles.card}>
          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successMessage}>
                If an account exists for {email}, you will receive password reset instructions shortly.
              </Text>
              <Button
                title="Return to Sign In"
                onPress={() => router.replace('/(auth)/login' as any)}
                variant="outline"
                style={styles.returnButton}
              />
            </View>
          ) : (
            <>
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
              />

              <Button
                title="Send Reset Instructions"
                onPress={handleSubmit}
                loading={loading}
                size="lg"
                style={styles.submitButton}
              />
            </>
          )}
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
    lineHeight: typography.lineHeight.sm,
  },
  card: {
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
    marginTop: spacing.sm,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  successMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.sm,
  },
  returnButton: {
    width: '100%',
  },
});
