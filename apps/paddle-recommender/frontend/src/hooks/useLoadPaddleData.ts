import { useEffect, useState } from 'react';
import { CombinedPaddle, getCombinedPaddles } from '@/services/fetch';

interface UseLoadPaddleDataResult {
  paddle: CombinedPaddle | null;
  loading: boolean;
  error: string | null;
}

export function useLoadPaddleData(paddleId: string | undefined): UseLoadPaddleDataResult {
  const [paddle, setPaddle] = useState<CombinedPaddle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPaddleData(): Promise<void> {
      try {
        setLoading(true);

        if (!paddleId) {
          setPaddle(null);
          setError(null);
          return;
        }

        const decodedId = decodeURIComponent(paddleId);
        const [company, ...nameParts] = decodedId.split('-');
        const paddleName = nameParts.join('-');

        const response = await getCombinedPaddles();
        const foundPaddle = response.data.find(
          p => p.company === company && p.paddleName === paddleName
        );

        if (foundPaddle) {
          setPaddle(foundPaddle);
          setError(null);
        } else {
          setPaddle(null);
          setError('Paddle not found');
        }
      } catch (err: unknown) {
        console.error('Failed to fetch paddle:', err);
        setPaddle(null);
        setError(err instanceof Error ? err.message : 'Failed to load paddle details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadPaddleData();
  }, [paddleId]);

  return { paddle, loading, error };
}
