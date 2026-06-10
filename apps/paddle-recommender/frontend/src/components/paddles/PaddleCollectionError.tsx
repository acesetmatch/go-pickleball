'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaddleCollectionErrorProps {
  message: string;
}

export function PaddleCollectionError({ message }: PaddleCollectionErrorProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Paddle Collection</h1>
      </div>

      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}
