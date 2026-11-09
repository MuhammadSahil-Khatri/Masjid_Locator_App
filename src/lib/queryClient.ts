import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

// ─── Cache & Persistence Constants ───────────────────────────────────────────
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days retention
export const CACHE_BUSTER = 'v1';
export const CACHE_STORAGE_KEY = 'MASJID_APP_QUERY_CACHE_V1';

// ─── Focus Manager: refetch when app comes to foreground ────────────────────────
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}
AppState.addEventListener('change', onAppStateChange);

// ─── Online Manager: native NetInfo integration ─────────────────────────────────
// Wires TanStack Query's onlineManager to OS network state changes.
// Uses isInternetReachable where available to differentiate between local interface
// link (e.g. connected to Wi-Fi without internet) and real internet access,
// without continuously pinging Supabase.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    const isOnline = Boolean(
      state.isConnected && (state.isInternetReachable == null || state.isInternetReachable)
    );
    setOnline(isOnline);
  });
});

// ─── QueryClient Configuration ──────────────────────────────────────────────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: CACHE_MAX_AGE,          // 7 days cache retention
      staleTime: 1000 * 60 * 5,       // 5 minutes fresh data window
      retry: (failureCount, error: any) => {
        // Do not retry 4xx client errors or explicit non-retry errors
        const status = error?.status || error?.statusCode || error?.code;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          return false;
        }
        if (status === 'PGRST116' || error?.message === 'offline_no_cache') {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: true,     // Revalidate stale queries when returning to active state
      refetchOnReconnect: true,       // Revalidate stale queries when connection returns (never refetches fresh data)
      refetchOnMount: true,           // Revalidate on screen mount only if data is stale
      networkMode: 'online',          // Only fetch when online; serve cached data without failed requests when offline
    },
    mutations: {
      networkMode: 'online',
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_STORAGE_KEY,
  throttleTime: 1000,
});

