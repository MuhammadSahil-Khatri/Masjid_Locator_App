/**
 * Centralized React Query Keys
 * Keeping query keys in a separate module prevents require cycles between
 * contexts, services, and query hooks.
 */

export const ANNOUNCEMENTS_QUERY_KEYS = {
  allPublic: ['announcements', 'public'] as const,
  categories: ['announcements', 'categories'] as const,
};

export const MOSQUES_QUERY_KEYS = {
  allActive: ['mosques', 'active'] as const,
};

export const HADITH_QUERY_KEYS = {
  publicList: ['hadith', 'public'] as const,
};

