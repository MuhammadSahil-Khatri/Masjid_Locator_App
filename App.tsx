import App from './src/App';

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Resolve DSN from Expo constants extra or fallback to process.env (for builds using babel-plugin-inline-dotenv)
const SENTRY_DSN =
  (Constants?.manifest?.extra?.sentryDsn as string) ||
  (process.env.SENTRY_DSN as string);

Sentry.init({
  dsn: SENTRY_DSN,
  // Enable native crash handling
  enableNative: true,
  // Capture JavaScript errors and unhandled promise rejections
  enableCaptureFailedRequests: true,
  // Enable performance tracing; adjust sample rate as needed
  enableAutoPerformanceTracing: true,
  tracesSampleRate: 0.2, // 20% of transactions in production
  // Breadcrumbs for navigation and UI interactions are enabled by default
  // Minimize debug output in production
  debug: __DEV__,
  // Disable unnecessary features in dev mode
  // enableWatchdog: !__DEV__, // removed - not in current SDK types
});

export default Sentry.wrap(App);
