'use client';

import { useEffect } from 'react';
import { PaddleCollectionError } from '@/components/paddles/PaddleCollectionError';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Paddles route error:', error);
  }, [error]);

  return (
    <div>
      <PaddleCollectionError message={error.message || 'Something went wrong.'} />
      <div className="container mx-auto px-4 pb-8">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
