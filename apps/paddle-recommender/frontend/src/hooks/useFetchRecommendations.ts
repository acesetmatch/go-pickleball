import { useEffect, useState } from 'react';
import type { Profile } from '@/schemas/profile';
import { CombinedPaddle } from '@/services/fetch';

interface UseFetchRecommendationsOptions {
  profile: Partial<Profile>;
  completeness: number;
  maxPaddles: number;
}

export function useFetchRecommendations({
  profile,
  completeness,
  maxPaddles,
}: UseFetchRecommendationsOptions) {
  const [topPaddles, setTopPaddles] = useState<CombinedPaddle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (completeness < 20) {
        setTopPaddles([]);
        return;
      }

      setLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/paddles/combined`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const allPaddles: CombinedPaddle[] = Array.isArray(data) ? data : [];

        if (allPaddles.length === 0) {
          console.warn('No paddles returned from API');
          setTopPaddles([]);
          return;
        }

        const sorted = allPaddles
          .filter(p => p.averageRating !== null)
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, maxPaddles);

        setTopPaddles(sorted);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setTopPaddles([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchRecommendations, 500);
    return () => clearTimeout(timeoutId);
  }, [profile, completeness, maxPaddles]);

  return { topPaddles, loading };
}
