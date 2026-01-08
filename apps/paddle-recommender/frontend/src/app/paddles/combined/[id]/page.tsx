'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCombinedPaddles, CombinedPaddle } from '@/services/fetch';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { CombinedPaddlePerformanceChart } from "@/components/CombinedPaddlePerformanceChart";

export default function CombinedPaddleDetailsPage() {
  const [paddle, setPaddle] = useState<CombinedPaddle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const paddleId = params.id as string;

  useEffect(() => {
    async function loadPaddleData(): Promise<void> {
      try {
        setLoading(true);

        // Decode the ID (format: "Company-PaddleName")
        const decodedId = decodeURIComponent(paddleId);
        const [company, ...nameParts] = decodedId.split('-');
        const paddleName = nameParts.join('-');

        // Fetch all combined paddles and find the matching one
        const response = await getCombinedPaddles();
        const foundPaddle = response.data.find(
          p => p.company === company && p.paddleName === paddleName
        );

        if (foundPaddle) {
          setPaddle(foundPaddle);
          setError(null);
        } else {
          setError('Paddle not found');
        }
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
  }, [paddleId]);

  const handleBack = () => {
    router.push('/paddles');
  };

  // Get source badge variant color
  const getSourceBadgeVariant = (source: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      'mattspickleball': 'default',
      'pickleballeffect': 'secondary',
      'pickleballstudio': 'outline'
    };
    return variants[source] || 'outline';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paddle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Paddle not found'}</AlertDescription>
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
      {/* Back Button */}
      <Button variant="outline" onClick={handleBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Paddles
      </Button>

      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-3xl mb-2">
                {paddle.company} {paddle.paddleName}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {Array.from(new Set(paddle.sources)).map((source, idx) => (
                  <Badge key={`${source}-${idx}`} variant={getSourceBadgeVariant(source)}>
                    {source === 'mattspickleball' ? "Matt's Pickleball" : source === 'pickleballeffect' ? 'Pickleball Effect' : 'Pickleball Studio'}
                  </Badge>
                ))}
                <Badge variant="outline">
                  {paddle.sourceCount} {paddle.sourceCount === 1 ? 'source' : 'sources'}
                </Badge>
              </div>
            </div>
            {paddle.bestOffer && (
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">${paddle.bestOffer.price}</div>
                <div className="text-sm text-muted-foreground">Best offer</div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Physical Specs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Physical Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paddle.shape && (
              <div>
                <span className="font-medium">Shape:</span> {paddle.shape}
              </div>
            )}
            {paddle.coreThickness && (
              <div>
                <span className="font-medium">Core Thickness:</span> {paddle.coreThickness}mm
              </div>
            )}
            {paddle.weight && (
              <div>
                <span className="font-medium">Weight:</span> {paddle.weight.toFixed(2)}oz
              </div>
            )}
            {paddle.weightGrams && (
              <div>
                <span className="font-medium">Weight:</span> {paddle.weightGrams}g
              </div>
            )}
            {paddle.length && (
              <div>
                <span className="font-medium">Length:</span> {paddle.length}"
              </div>
            )}
            {paddle.width && (
              <div>
                <span className="font-medium">Width:</span> {paddle.width}"
              </div>
            )}
            {paddle.gripLength && (
              <div>
                <span className="font-medium">Grip Length:</span> {paddle.gripLength}"
              </div>
            )}
            {paddle.gripCircumference && (
              <div>
                <span className="font-medium">Grip Circumference:</span> {paddle.gripCircumference}"
              </div>
            )}
            {paddle.gripSize && (
              <div>
                <span className="font-medium">Grip Size:</span> {paddle.gripSize}"
              </div>
            )}
            {paddle.balancePoint && (
              <div>
                <span className="font-medium">Balance Point:</span> {paddle.balancePoint}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paddle.swingWeight && (
              <div>
                <span className="font-medium">Swing Weight:</span> {paddle.swingWeight.toFixed(1)}
              </div>
            )}
            {paddle.twistWeight && (
              <div>
                <span className="font-medium">Twist Weight:</span> {paddle.twistWeight.toFixed(2)}
              </div>
            )}
            {paddle.spinRPM && (
              <div>
                <span className="font-medium">Spin RPM:</span> {paddle.spinRPM}
              </div>
            )}
            {paddle.serveSpeed && (
              <div>
                <span className="font-medium">Serve Speed:</span> {paddle.serveSpeed} mph
              </div>
            )}
            {paddle.punchVolleySpeed && (
              <div>
                <span className="font-medium">Punch Volley Speed:</span> {paddle.punchVolleySpeed} mph
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ratings */}
      {(paddle.controlRating || paddle.feelRating || paddle.forgivenessRating || paddle.powerRating || paddle.spinRating || paddle.touchShotsRating || paddle.paddleRating) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paddle.controlRating && (
                <div>
                  <span className="font-medium">Control:</span> {paddle.controlRating}/10
                </div>
              )}
              {paddle.feelRating && (
                <div>
                  <span className="font-medium">Feel:</span> {paddle.feelRating}/10
                </div>
              )}
              {paddle.forgivenessRating && (
                <div>
                  <span className="font-medium">Forgiveness:</span> {paddle.forgivenessRating}/10
                </div>
              )}
              {paddle.powerRating && (
                <div>
                  <span className="font-medium">Power:</span> {paddle.powerRating}
                </div>
              )}
              {paddle.spinRating && (
                <div>
                  <span className="font-medium">Spin:</span> {paddle.spinRating}
                </div>
              )}
              {paddle.touchShotsRating && (
                <div>
                  <span className="font-medium">Touch Shots:</span> {paddle.touchShotsRating}/10
                </div>
              )}
              {paddle.paddleRating && (
                <div>
                  <span className="font-medium">Overall Rating:</span> {paddle.paddleRating}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Percentiles */}
      {(paddle.swingWeightPercentile || paddle.twistWeightPercentile || paddle.powerPercentile || paddle.popPercentile || paddle.spinPercentile) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Percentiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paddle.swingWeightPercentile && (
                <div>
                  <span className="font-medium">Swing Weight:</span> {paddle.swingWeightPercentile}
                </div>
              )}
              {paddle.twistWeightPercentile && (
                <div>
                  <span className="font-medium">Twist Weight:</span> {paddle.twistWeightPercentile}
                </div>
              )}
              {paddle.powerPercentile && (
                <div>
                  <span className="font-medium">Power:</span> {paddle.powerPercentile}
                </div>
              )}
              {paddle.popPercentile && (
                <div>
                  <span className="font-medium">Pop:</span> {paddle.popPercentile}
                </div>
              )}
              {paddle.spinPercentile && (
                <div>
                  <span className="font-medium">Spin:</span> {paddle.spinPercentile}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials & Construction */}
      {(paddle.faceMaterial || paddle.coreMaterial || paddle.surfaceTexture || paddle.buildType || paddle.manufacturingProcess || paddle.paddleType) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Materials & Construction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paddle.faceMaterial && (
                <div>
                  <span className="font-medium">Face Material:</span> {paddle.faceMaterial}
                </div>
              )}
              {paddle.coreMaterial && (
                <div>
                  <span className="font-medium">Core Material:</span> {paddle.coreMaterial}
                </div>
              )}
              {paddle.surfaceTexture && (
                <div>
                  <span className="font-medium">Surface Texture:</span> {paddle.surfaceTexture}
                </div>
              )}
              {paddle.buildType && (
                <div>
                  <span className="font-medium">Build Type:</span> {paddle.buildType}
                </div>
              )}
              {paddle.manufacturingProcess && (
                <div>
                  <span className="font-medium">Manufacturing Process:</span> {paddle.manufacturingProcess}
                </div>
              )}
              {paddle.paddleType && (
                <div>
                  <span className="font-medium">Paddle Type:</span> {paddle.paddleType}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      {(paddle.releaseYear || paddle.approvalBody) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paddle.releaseYear && (
                <div>
                  <span className="font-medium">Release Year:</span> {paddle.releaseYear}
                </div>
              )}
              {paddle.approvalBody && (
                <div>
                  <span className="font-medium">Approval Body:</span> {paddle.approvalBody}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Options */}
      {paddle.allSourceData && paddle.allSourceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Purchase Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paddle.allSourceData
                .filter(offer => offer.price)
                .map((offer, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSourceBadgeVariant(offer.source)}>
                          {offer.source === 'mattspickleball' ? "Matt's Pickleball" : offer.source === 'pickleballeffect' ? 'Pickleball Effect' : 'Pickleball Studio'}
                        </Badge>
                        {paddle.bestOffer?.source === offer.source && (
                          <Badge variant="secondary">Best Price</Badge>
                        )}
                      </div>
                      <div className="text-2xl font-bold">${offer.price}</div>
                      {offer.discountCode && (
                        <div className="text-sm text-muted-foreground">
                          Use code: <span className="font-mono font-semibold">{offer.discountCode}</span>
                        </div>
                      )}
                    </div>
                    {offer.purchaseLink && (
                      <Button onClick={() => window.open(offer.purchaseLink, '_blank')}>
                        Buy Now
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* YouTube Review */}
      {paddle.youtubeReview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Video Review</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.open(paddle.youtubeReview, '_blank')}>
              Watch on YouTube
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Performance Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <CombinedPaddlePerformanceChart paddle={paddle} />
        </CardContent>
      </Card>
    </div>
  );
}
