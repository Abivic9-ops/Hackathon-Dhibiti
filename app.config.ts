import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [['expo-dev-client', { launchMode: 'most-recent' }]]
      : [];

  return {
    ...config,
    name: 'Dhibiti',
    slug: 'dhibiti',
    version: process.env.DHIBITI_APP_VERSION ?? '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'dhibiti',
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      supportsTablet: true,
      bundleIdentifier: process.env.DHIBITI_IOS_BUNDLE_ID ?? 'com.dhibiti.app',
    },
    android: {
      package: process.env.DHIBITI_ANDROID_PACKAGE ?? 'com.dhibiti.app',
    },
    web: {
      bundler: 'metro',
      // 'single' = SPA export: one index.html + client routing, so edge serving
      // needs only a single 404→index.html fallback rule.
      output: 'single',
      favicon: './public/icons/icon-192.png',
    },
    extra: {
      appStoreAppId: process.env.DHIBITI_APP_STORE_APP_ID,
    },
    plugins: ['expo-router', 'expo-font', ...nativePlugins],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
