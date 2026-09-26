import { useQuery } from '@tanstack/react-query';
import { announcementService, Announcement, AnnouncementCategory } from '../services/announcementService';

export const ANNOUNCEMENTS_QUERY_KEYS = {
  allPublic: ['announcements', 'public'] as const,
  categories: ['announcements', 'categories'] as const,
};

/**
 * Hook to load public announcements with offline persistence.
 */
export function usePublicAnnouncementsQuery() {
  return useQuery<Announcement[]>({
    queryKey: ANNOUNCEMENTS_QUERY_KEYS.allPublic,
    queryFn: () => announcementService.fetchPublicAnnouncements(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days in persistent storage
  });
}

/**
 * Hook to load announcement categories with offline persistence.
 */
export function useAnnouncementCategoriesQuery() {
  return useQuery<AnnouncementCategory[]>({
    queryKey: ANNOUNCEMENTS_QUERY_KEYS.categories,
    queryFn: () => announcementService.fetchCategories(),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days in persistent storage
  });
}
