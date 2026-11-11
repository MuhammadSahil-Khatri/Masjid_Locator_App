import { useQuery, onlineManager } from '@tanstack/react-query';
import { announcementService, Announcement, AnnouncementCategory } from '../services/announcementService';
import { storageService } from '../services/storageService';
import { queryClient } from '../lib/queryClient';
import { ANNOUNCEMENTS_QUERY_KEYS } from './queryKeys';

export { ANNOUNCEMENTS_QUERY_KEYS };

/**
 * Hook to load public announcements with offline persistence.
 * - Online: fetches fresh data from Supabase and persists to cache
 * - Offline + cache: returns locally cached announcements without network requests
 * - Offline + no cache: throws 'offline_no_cache' so UI can show "Internet Unavailable"
 */
export function usePublicAnnouncementsQuery() {
  return useQuery<Announcement[]>({
    queryKey: ANNOUNCEMENTS_QUERY_KEYS.allPublic,
    queryFn: async () => {
      const isOnline = onlineManager.isOnline();
      if (!isOnline) {
        const cachedFromQuery = queryClient.getQueryData<Announcement[]>(ANNOUNCEMENTS_QUERY_KEYS.allPublic);
        if (cachedFromQuery && cachedFromQuery.length > 0) return cachedFromQuery;

        const cached = storageService.getCachedAnnouncements();
        if (cached && cached.length > 0) return cached as Announcement[];

        throw new Error('offline_no_cache');
      }
      return announcementService.fetchPublicAnnouncements();
    },
    staleTime: 1000 * 60 * 2,         // 2 minutes fresh window
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days in persistent storage
    refetchOnMount: true,             // Revalidate on mount only if stale
    refetchOnReconnect: true,         // Revalidate on reconnect only if stale
    retry: (failureCount, error: any) => {
      // Don't retry when offline with no cache
      if (error?.message === 'offline_no_cache') return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook to load announcement categories.
 * Only runs when the user is authenticated — the table rejects anonymous reads.
 */
export function useAnnouncementCategoriesQuery(options?: { enabled?: boolean }) {
  return useQuery<AnnouncementCategory[]>({
    queryKey: ANNOUNCEMENTS_QUERY_KEYS.categories,
    queryFn: () => announcementService.fetchCategories(),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 60,        // 1 hour
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days in persistent storage
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}
