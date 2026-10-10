import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { LoadingScreen } from '../src/components/common/LoadingScreen';
import { colors } from '../src/constants/theme';

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes cache
      retry: 1,
    },
  },
});

function NavigationGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not signed in and trying to access protected screen -> redirect to login
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      // User is signed in and trying to access auth screens -> redirect to dashboard
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingScreen message="Initializing EduTalentX..." />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <StatusBar style="dark" />
            <NavigationGate>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.textPrimary,
                  headerTitleStyle: { fontWeight: '600' },
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="student/career-match"
                  options={{ title: 'AI Career Match', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="student/career-lab"
                  options={{ title: 'Career Lab Simulator', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="student/github"
                  options={{ title: 'GitHub Intelligence', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="student/availability"
                  options={{ title: 'Placement Availability', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="recruiter/search"
                  options={{ title: 'Search Developers', headerBackTitle: 'Back' }}
                />
                <Stack.Screen
                  name="teacher/verification"
                  options={{ title: 'Student Verification', headerBackTitle: 'Back' }}
                />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Details' }} />
              </Stack>
            </NavigationGate>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
