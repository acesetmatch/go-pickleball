// app/paddles/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPaddleById } from '@/lib/fetch';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";

// Define TypeScript interfaces for our data structure
interface Metadata {
  brand: string;
  model: string;
  serial_code: string;
}

interface Specs {
  shape: string;
  surface: string;
  average_weight: number;
  core: number;
  paddle_length: number;
  paddle_width: number;
  grip_length: number;
  grip_type: string;
  grip_circumference: number;
}

interface Performance {
  power: number;
  pop: number;
  spin: number;
  twist_weight: number;
  swing_weight: number;
  balance_point: number;
}

interface Paddle {
  id: string;
  metadata: Metadata;
  specs: Specs;
  performance: Performance;
}

export default function PaddleDetails() {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const paddleId = params.id as string;

  useEffect(() => {
    async function loadPaddleData(): Promise<void> {
      try {
        setLoading(true);
        const data = await getPaddleById(paddleId);
        setPaddle(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch paddle:', err);
        setError(err.message || 'Failed to load paddle details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (paddleId) {
      loadPaddleData();
    }
  }, [paddleId]);

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
          <Button variant="outline" onClick={() => window.history.back()}>
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
          <AlertDescription>The paddle you're looking for could not be found.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-3xl">{paddle.metadata.brand} {paddle.metadata.model}</CardTitle>
          <div className="text-primary-foreground/80">
            <p>ID: {paddle.id}</p>
            <p>Serial: {paddle.metadata.serial_code}</p>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Specifications */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Specifications</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Shape</TableCell>
                    <TableCell>{paddle.specs.shape}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Surface</TableCell>
                    <TableCell>{paddle.specs.surface}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Weight</TableCell>
                    <TableCell>{paddle.specs.average_weight}g</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Core</TableCell>
                    <TableCell>{paddle.specs.core}mm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Length</TableCell>
                    <TableCell>{paddle.specs.paddle_length}"</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Width</TableCell>
                    <TableCell>{paddle.specs.paddle_width}"</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Grip Length</TableCell>
                    <TableCell>{paddle.specs.grip_length}"</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Grip Type</TableCell>
                    <TableCell>{paddle.specs.grip_type}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Grip Circumference</TableCell>
                    <TableCell>{paddle.specs.grip_circumference}"</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Performance */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Performance</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Power</TableCell>
                    <TableCell>{paddle.performance.power}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Pop</TableCell>
                    <TableCell>{paddle.performance.pop}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Spin</TableCell>
                    <TableCell>{paddle.performance.spin} RPM</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Twist Weight</TableCell>
                    <TableCell>{paddle.performance.twist_weight}g</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Swing Weight</TableCell>
                    <TableCell>{paddle.performance.swing_weight}g</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Balance Point</TableCell>
                    <TableCell>{paddle.performance.balance_point}cm</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t p-6 flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button>Compare</Button>
        </CardFooter>
      </Card>
    </div>
  );
}