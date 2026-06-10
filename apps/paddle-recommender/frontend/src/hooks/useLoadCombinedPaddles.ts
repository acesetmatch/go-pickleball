import { CombinedPaddle, getCombinedPaddles } from '@/services/fetch';
import { useQuery } from '@tanstack/react-query';

interface UseLoadCombinedPaddlesResult {
  paddles: CombinedPaddle[];
  loading: boolean;
  error: string | null;
}

export function useLoadCombinedPaddles(): UseLoadCombinedPaddlesResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['combinedPaddles'],
    queryFn: async () => {
      const response = await getCombinedPaddles();
      return response.data;
    }
  });

  return {
    paddles: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Failed to load paddles. Please try again later.' : null
  };
}
