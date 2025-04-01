'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PaddleCard } from '@/components/PaddleCard';
import { getAllPaddles, Paddle } from '@/services/fetch';
import paddlesData from '@/data/paddles.json';

// Data source options
type DataSource = 'api' | 'json';

export default function PaddleList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [paddles, setPaddles] = useState<Paddle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('api');

  // Effect to read URL params for data source on initial load
  useEffect(() => {
    const sourceParam = searchParams.get('source') as DataSource | null;
    if (sourceParam && (sourceParam === 'api' || sourceParam === 'json')) {
      setDataSource(sourceParam);
    }
  }, [searchParams]);

  // Effect to load all paddles
  useEffect(() => {
    async function fetchPaddles() {
      try {
        setLoading(true);
        
        if (dataSource === 'api') {
          // Fetch from API - no type casting needed now
          const data = await getAllPaddles();
          setPaddles(data);
        } else {
          // Use local JSON data with a small delay to simulate network
          setTimeout(() => {
            setPaddles(paddlesData as Paddle[]);
          }, 500);
        }
        
        setError(null);
      } catch (err: unknown) {
        console.error('Failed to load paddles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load paddles. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPaddles();
  }, [dataSource]); // Re-fetch when data source changes

  // Data source toggle component
  const DataSourceToggle = () => (
    <div className="flex items-center space-x-2">
      <Button 
        variant={dataSource === 'api' ? "default" : "outline"}
        size="sm"
        onClick={() => {
          const newSource = dataSource === 'api' ? 'json' : 'api';
          setDataSource(newSource);
          
          // Update URL with data source
          const params = new URLSearchParams(searchParams.toString());
          params.set('source', newSource);
          router.push(`/paddles?${params.toString()}`);
        }}
      >
        {dataSource === 'api' ? 'Using API' : 'Using JSON'}
      </Button>
      <span className="text-xs text-muted-foreground ml-2">
        {dataSource === 'api' ? 'Click to switch to JSON' : 'Click to switch to API'}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Paddle Collection</h1>
          <DataSourceToggle />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48">
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Paddle Collection</h1>
          <DataSourceToggle />
        </div>
        
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        {dataSource === 'api' && (
          <div className="mt-4">
            <Alert>
              <AlertTitle>Try using JSON data</AlertTitle>
              <AlertDescription>
                There seems to be an issue with the API. Try switching to JSON data using the toggle above.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    );
  }

  // Show the list of paddles
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Paddle Collection</h1>
        <DataSourceToggle />
      </div>
      
      {paddles.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No paddles found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paddles.map((paddle) => (
            <PaddleCard 
              key={paddle.id} 
              paddle={paddle} 
            />
          ))}
        </div>
      )}
    </div>
  );
} 