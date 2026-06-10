'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CombinedPaddle } from '@/services/fetch';
import { getSourceBadgeVariant } from '@/components/paddles/sourceBadges';

interface CombinedPaddleCardProps {
  paddle: CombinedPaddle;
  className?: string;
}

export function CombinedPaddleCard({ paddle, className }: CombinedPaddleCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className || ''}`.trim()}>
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
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {paddle.sourceCount} {paddle.sourceCount === 1 ? 'source' : 'sources'}
              </Badge>
            </div>
          </div>
          {paddle.bestOffer && (
            <Badge variant="secondary" className="shrink-0">${paddle.bestOffer.price}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col space-y-2">
        {paddle.shape && <p className="text-sm"><span className="font-medium">Shape:</span> {paddle.shape}</p>}
        {paddle.coreThickness && <p className="text-sm"><span className="font-medium">Core:</span> {paddle.coreThickness}mm</p>}
        {paddle.weight && <p className="text-sm"><span className="font-medium">Weight:</span> {paddle.weight.toFixed(2)}oz</p>}
        {paddle.swingWeight && <p className="text-sm"><span className="font-medium">Swing Weight:</span> {paddle.swingWeight.toFixed(1)}</p>}
        {paddle.twistWeight && <p className="text-sm"><span className="font-medium">Twist Weight:</span> {paddle.twistWeight.toFixed(2)}</p>}
        {paddle.spinRPM && <p className="text-sm"><span className="font-medium">Spin:</span> {paddle.spinRPM} RPM</p>}
        {paddle.paddleRating && <p className="text-sm"><span className="font-medium">Rating:</span> {paddle.paddleRating}</p>}
        <Link
          href={`/paddles/combined/${encodeURIComponent(paddle.company)}-${encodeURIComponent(paddle.paddleName)}`}
          className="mt-auto"
        >
          <Button size="sm" className="w-full">
            More Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
