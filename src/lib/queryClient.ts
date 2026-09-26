import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

// Refetch queries when the app returns from background to foreground
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

AppState.addEventListener('change', onAppStateChange);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache retention
      staleTime: 1000 * 60 * 5,         // 5 minutes fresh data window
      retry: 1,                         // Max 1 retry to avoid network spam on offline/poor connection
      refetchOnWindowFocus: true,       // Auto-refetch when user brings app to foreground
      refetchOnReconnect: true,         // Background re-validation
      networkMode: 'offlineFirst',      // Always use cached data first without blocking
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'MASJID_APP_QUERY_CACHE_V1',
  throttleTime: 1000,
});
