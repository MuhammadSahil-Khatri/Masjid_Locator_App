import { useQuery } from '@tanstack/react-query';
import { hadithService, Hadith } from '../services/hadithService';

export const HADITH_QUERY_KEYS = {
  publicList: ['hadith', 'public'] as const,
};

/**
 * Hook to load public Ahadees with offline persistence.
 */
export function usePublicHadithQuery() {
  return useQuery<Hadith[]>({
    queryKey: HADITH_QUERY_KEYS.publicList,
    queryFn: () => hadithService.fetchPublicHadith(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days in persistent storage
  });
}
