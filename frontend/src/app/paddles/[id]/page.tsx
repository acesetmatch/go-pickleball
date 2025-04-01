// app/paddles/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getPaddleById, Paddle } from '@/services/fetch';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";
import { PaddleDetails } from '@/components/PaddleDetails';
import { PaddlePerformanceChart } from '@/components/PaddlePerformanceChart';
import paddlesData from '@/data/paddles.json';

// Data source options
type DataSource = 'api' | 'json';

export default function PaddleDetailsPage() {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('api');
  
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paddleId = params.id as string;

  // Effect to read URL params for data source on initial load
  useEffect(() => {
    const sourceParam = searchParams.get('source') as DataSource | null;
    if (sourceParam && (sourceParam === 'api' || sourceParam === 'json')) {
      setDataSource(sourceParam);
    }
  }, [searchParams]);

  // Effect to load paddle data
  useEffect(() => {
    async function loadPaddleData(): Promise<void> {
      try {
        setLoading(true);
        
        if (dataSource === 'api') {
          // Fetch from API - no type casting needed now
          const data = await getPaddleById(paddleId);
          setPaddle(data);
        } else {
          // Use local JSON data
          setTimeout(() => {
            const foundPaddle = (paddlesData as Paddle[]).find(p => p.id === paddleId);
            setPaddle(foundPaddle || null);
          }, 500);
        }
        
        setError(null);
      } catch (err: unknown) {
        console.error('Failed to fetch paddle:', err);
        setError(err instanceof Error ? err.message : 'Failed to load paddle details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (paddleId) {
      loadPaddleData();
    }
  }, [paddleId, dataSource]);

  const handleBack = () => {
    // Preserve the data source when going back
    const source = searchParams.get('source');
    const backUrl = source ? `/paddles?source=${source}` : '/paddles';
    router.push(backUrl);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-40 w-full" />
              </div>
              <div>
                <Skeleton className="h-6 w-1/3 mb-4" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Performance Metrics Skeleton */}
        <Card className="mt-8">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!paddle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTitle>Paddle Not Found</AlertTitle>
          <AlertDescription>The paddle you are looking for could not be found.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PaddleDetails paddle={paddle} onBack={handleBack} />
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Performance Metrics</h2>
          </CardHeader>
          <CardContent>
            <PaddlePerformanceChart paddle={paddle} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}