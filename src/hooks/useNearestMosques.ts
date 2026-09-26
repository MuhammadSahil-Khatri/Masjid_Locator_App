import { useNearestMosquesQuery } from '../queries/useMosquesQueries';
import { SearchMosque } from '../types/search';

interface UseNearestMosquesResult {
  mosques: SearchMosque[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNearestMosques(
  userLocation?: { lat: number; lng: number } | null
): UseNearestMosquesResult {
  const { mosques, allMosques, isLoading, error, refetch } = useNearestMosquesQuery(userLocation);

  return {
    mosques,
    loading: isLoading && allMosques.length === 0,
    error: error ? (error as Error).message : null,
    refetch: () => { refetch(); },
  };
}
