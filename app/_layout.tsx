// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import * as DevClient from 'expo-dev-client';
import { HeroUINativeProvider } from 'heroui-native';
import { StatusBar } from 'expo-status-bar';
import { Uniwind } from 'uniwind';
import { configureReanimatedLogger } from 'react-native-reanimated';
import {
  ErrorBoundary as ExpoErrorBoundary,
  type ErrorBoundaryProps,
  SplashScreen,
  Stack,
} from 'expo-router';

import { initPostHog } from '@/lib/posthog';
import { registerServiceWorker } from '@/lib/registerServiceWorker';
import { reportErrorToParent } from '@/lib/reportPreviewError';
import { InstallPrompt } from '@/components/InstallPrompt';
import { colors, setThemeMode } from '@/lib/theme';
import { useStore } from '@/lib/store';

/**
 * Custom ErrorBoundary that reports React render errors to the parent window (preview iframe)
 * and then renders the default Expo error UI.
 */
function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (Platform.OS === 'web' && error) {
      const message = [error.message, error.stack].filter(Boolean).join('\n');
      reportErrorToParent(message);
    }
  }, [error]);
  return <ExpoErrorBoundary error={error} retry={retry} />;
}

export { ErrorBoundary };

// Dhibiti is dark-mode first, but the user's persisted choice wins at launch.
// Hydration may flip this later (see `hydrate`), which a theme-effect below
// picks up once the persisted store state has loaded.
Uniwind.setTheme(useStore.getState().theme);
setThemeMode(useStore.getState().theme);

// Every `.value` read in Dhibiti's own components lives inside a
// `useAnimatedStyle` worklet. Reanimated's strict-only render-access warning
// can still fire from library internals during a re-render on web, so we opt
// out of that strict diagnostic (the documented escape hatch for this check).
configureReanimatedLogger({ strict: false });

void SplashScreen.preventAutoHideAsync();

const cardScreen = { presentation: 'card' } as const;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });
  const theme = useStore((state) => state.theme);
  const hydrated = useStore((state) => state.hydrated);
  const hydrate = useStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Keep Uniwind's theme in sync whenever the store changes it. `setThemeMode`
  // is synchronous (so `colors.*` reads are correct on the same render); this
  // effect tells Uniwind to regenerate theme-scoped class styles.
  useEffect(() => {
    setThemeMode(theme);
    Uniwind.setTheme(theme);
  }, [theme]);

  // Report uncaught JS errors and unhandled promise rejections to parent (preview iframe)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const handleError = (event: ErrorEvent) => {
      const message = event.error?.stack ?? event.message ?? 'Unknown error';
      reportErrorToParent(message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const message =
        err instanceof Error ? [err.message, err.stack].filter(Boolean).join('\n') : String(err);
      reportErrorToParent(message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Inject the Poppins web font link so it also loads through the preview proxy.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const existingLink = document.querySelector(
      'link[href*="fonts.googleapis.com/css2?family=Poppins"]',
    );
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (__DEV__ && Platform.OS !== 'web' && !isExpoGo) {
      const timer = setTimeout(() => {
        DevClient.closeMenu();
        DevClient.hideMenu();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      initPostHog();
    }
  }, []);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if ((loaded || error) && hydrated) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error, hydrated]);

  // Wait for fonts AND the persisted store (theme, language, onboarding) before
  // first paint, so the app never flashes one theme before revealing another.
  if (!loaded && !error && !hydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        {/* StatusBar's `style` prop is a text-style enum ('light' | 'dark' | 'auto'), not a RN style object. */}
        {/* oxlint-disable-next-line react/style-prop-object */}
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.ink },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding/slides" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding/auth" options={cardScreen} />
          <Stack.Screen name="onboarding/otp" options={cardScreen} />
          <Stack.Screen name="onboarding/permissions" options={cardScreen} />
          <Stack.Screen name="onboarding/family" options={cardScreen} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="check/message" options={cardScreen} />
          <Stack.Screen name="check/call" options={cardScreen} />
          <Stack.Screen name="check/qr" options={cardScreen} />
          <Stack.Screen name="check/lookup" options={cardScreen} />
          <Stack.Screen name="check/link" options={cardScreen} />
          <Stack.Screen name="check/processing" options={{ animation: 'fade' }} />
          <Stack.Screen name="check/[id]" options={{ animation: 'fade' }} />
          <Stack.Screen name="entity/[identifier]" options={cardScreen} />
          <Stack.Screen name="report/new" options={cardScreen} />
          <Stack.Screen name="quarantine/index" options={cardScreen} />
          <Stack.Screen name="pay/verify" options={cardScreen} />
          <Stack.Screen name="pay/result" options={{ animation: 'fade' }} />
          <Stack.Screen name="pay/confirm" options={cardScreen} />
          <Stack.Screen name="pay/log" options={{ presentation: 'modal' }} />
          <Stack.Screen name="family/invite" options={cardScreen} />
          <Stack.Screen name="family/member/[id]" options={cardScreen} />
          <Stack.Screen name="family/guide" options={cardScreen} />
          <Stack.Screen name="groups/index" options={cardScreen} />
          <Stack.Screen name="groups/new" options={cardScreen} />
          <Stack.Screen name="groups/[id]" options={cardScreen} />
          <Stack.Screen name="groups/broadcast" options={cardScreen} />
          <Stack.Screen name="contacts/index" options={cardScreen} />
          <Stack.Screen name="contacts/new" options={cardScreen} />
          <Stack.Screen name="institutions/index" options={cardScreen} />
          <Stack.Screen name="radar/index" options={cardScreen} />
          <Stack.Screen name="lesson/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="browser/index" options={cardScreen} />
          <Stack.Screen name="more/profile" options={cardScreen} />
          <Stack.Screen name="more/permissions" options={cardScreen} />
          <Stack.Screen name="more/literacy" options={cardScreen} />
          <Stack.Screen name="more/simulator" options={cardScreen} />
          <Stack.Screen name="more/widget" options={cardScreen} />
          <Stack.Screen name="more/about" options={cardScreen} />
        </Stack>
        <InstallPrompt />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
