import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

// ─── Focus Manager: refetch when app comes to foreground ────────────────────────
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}
AppState.addEventListener('change', onAppStateChange);

// ─── Online Manager: probe connectivity on every foreground event ───────────────
// Uses a lightweight fetch HEAD request to detect real internet access.
// This wires TanStack Query's onlineManager so refetchOnReconnect fires correctly.
async function checkConnectivity(): Promise<boolean> {
  try {
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      headers: { 'Cache-Control': 'no-cache' },
    });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

// Set initial online state and update on every app state change
checkConnectivity().then((online) => onlineManager.setOnline(online));

AppState.addEventListener('change', async (status: AppStateStatus) => {
  if (status === 'active') {
    const online = await checkConnectivity();
    onlineManager.setOnline(online);
  }
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache retention
      staleTime: 1000 * 60 * 5,         // 5 minutes fresh data window
      retry: 2,
      refetchOnWindowFocus: true,       // Auto-refetch when user brings app to foreground
      refetchOnReconnect: 'always',     // Refetch ALL queries when network reconnects
      networkMode: 'online',            // Required for refetchOnReconnect to fire
    },
    mutations: {
      networkMode: 'online',
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'MASJID_APP_QUERY_CACHE_V1',
  throttleTime: 1000,
});
