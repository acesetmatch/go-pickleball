'use client'

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCombinedPaddles, CombinedPaddle } from '@/services/fetch';

function PaddleListContent() {
  const [paddles, setPaddles] = useState<CombinedPaddle[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to load all paddles
  useEffect(() => {
    async function fetchPaddles() {
      try {
        setLoading(true);

        // Load combined median paddle data
        const response = await getCombinedPaddles();
        setPaddles(response.data);

        setError(null);
      } catch (err: unknown) {
        console.error('Failed to load paddles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load paddles. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPaddles();
  }, []); // Load once on mount

  // Normalize company name for grouping (same logic as backend)
  const normalizeCompanyName = (company: string): string => {
    return company
      .toLowerCase()
      .trim()
      .replace(/[-\s](co|company|inc|llc|corporation)\.?$/i, '')
      .replace(/\s*&\s*/g, '')
      .replace(/\s+and\s+/g, '')
      .replace(/[\s\-\._]/g, '')
      .trim();
  };

  // Get unique brands (grouped by normalized name, showing the best display name)
  const brands = useMemo(() => {
    // Group companies by normalized name
    const brandMap = new Map<string, string[]>();
    paddles.forEach(p => {
      if (p.company) {
        const normalized = normalizeCompanyName(p.company);
        if (!brandMap.has(normalized)) {
          brandMap.set(normalized, []);
        }
        brandMap.get(normalized)!.push(p.company);
      }
    });

    // Pick the best display name for each normalized group (prefer & and spaces)
    const displayBrands = Array.from(brandMap.values()).map(names => {
      const uniqueNames = Array.from(new Set(names));
      return uniqueNames.sort((a, b) => {
        const aHasAmpersand = a.includes('&') ? 1 : 0;
        const bHasAmpersand = b.includes('&') ? 1 : 0;
        if (aHasAmpersand !== bHasAmpersand) return bHasAmpersand - aHasAmpersand;

        const aHasSpace = a.includes(' ') ? 1 : 0;
        const bHasSpace = b.includes(' ') ? 1 : 0;
        if (aHasSpace !== bHasSpace) return bHasSpace - aHasSpace;

        return b.length - a.length;
      })[0];
    });

    return displayBrands.sort();
  }, [paddles]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    paddles.forEach(p => {
      if (p.company) {
        const normalized = normalizeCompanyName(p.company);
        // Find the display name for this normalized company
        const displayName = brands.find(b => normalizeCompanyName(b) === normalized) || p.company;
        counts[displayName] = (counts[displayName] || 0) + 1;
      }
    });
    return counts;
  }, [paddles, brands]);

  // Filter paddles by selected brand (using normalized comparison)
  const filteredPaddles = useMemo(() => {
    if (selectedBrand === 'all') {
      return paddles;
    }
    const normalizedSelected = normalizeCompanyName(selectedBrand);
    return paddles.filter(p => normalizeCompanyName(p.company) === normalizedSelected);
  }, [paddles, selectedBrand]);


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Paddle Collection</h1>
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
        </div>

        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get source badge variant color
  const getSourceBadgeVariant = (source: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      'mattspickleball': 'default',
      'pickleballeffect': 'secondary',
      'pickleballstudio': 'outline'
    };
    return variants[source] || 'outline';
  };

  // Render combined paddle card
  const renderCombinedPaddleCard = (paddle: CombinedPaddle, index: number) => (
    <Card key={`${paddle.company}-${paddle.paddleName}-${index}`} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">
              {paddle.company} {paddle.paddleName}
            </CardTitle>
            <div className="flex gap-1 mt-1">
              {Array.from(new Set(paddle.sources)).map((source, idx) => (
                <Badge key={`${source}-${idx}`} variant={getSourceBadgeVariant(source)} className="text-xs">
                  {source === 'mattspickleball' ? 'MPB' : source === 'pickleballeffect' ? 'PBE' : 'PBS'}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                {paddle.sourceCount} {paddle.sourceCount === 1 ? 'source' : 'sources'}
              </Badge>
            </div>
          </div>
          {paddle.bestOffer && (
            <Badge variant="secondary" className="shrink-0">${paddle.bestOffer.price}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {paddle.shape && <p className="text-sm"><span className="font-medium">Shape:</span> {paddle.shape}</p>}
        {paddle.coreThickness && <p className="text-sm"><span className="font-medium">Core:</span> {paddle.coreThickness}mm</p>}
        {paddle.weight && <p className="text-sm"><span className="font-medium">Weight:</span> {paddle.weight.toFixed(2)}oz</p>}
        {paddle.swingWeight && <p className="text-sm"><span className="font-medium">Swing Weight:</span> {paddle.swingWeight.toFixed(1)}</p>}
        {paddle.twistWeight && <p className="text-sm"><span className="font-medium">Twist Weight:</span> {paddle.twistWeight.toFixed(2)}</p>}
        {paddle.spinRPM && <p className="text-sm"><span className="font-medium">Spin:</span> {paddle.spinRPM} RPM</p>}
        {paddle.paddleRating && <p className="text-sm"><span className="font-medium">Rating:</span> {paddle.paddleRating}</p>}
        <Link href={`/paddles/combined/${encodeURIComponent(paddle.company)}-${encodeURIComponent(paddle.paddleName)}`}>
          <Button size="sm" className="w-full mt-2">
            More Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  // Show the list of paddles
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Paddle Collection</h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Brand:</span>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Brands ({paddles.length})
                </SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>
                    {brand} ({brandCounts[brand]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline">
            {filteredPaddles.length} {filteredPaddles.length === 1 ? 'paddle' : 'paddles'}
          </Badge>
        </div>
      </div>

      {filteredPaddles.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No paddles found for this brand.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPaddles.map((paddle, i) => renderCombinedPaddleCard(paddle, i))}
        </div>
      )}
    </div>
  );
}

export default function PaddleList() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Paddle Collection</h1>
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
    }>
      <PaddleListContent />
    </Suspense>
  );
} 