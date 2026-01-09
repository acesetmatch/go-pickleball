'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Sparkles, Award } from 'lucide-react';
import { useOnboardingStore } from '@/store/onboarding';
import { useFetchRecommendations } from '@/hooks/useFetchRecommendations';

interface PaddlePreviewProps {
  className?: string;
  maxPaddles?: number;
}

export function PaddlePreview({ className, maxPaddles = 3 }: PaddlePreviewProps) {
  const { profile } = useOnboardingStore();
  const [completeness, setCompleteness] = useState(0);
  const { topPaddles, loading } = useFetchRecommendations({
    profile,
    completeness,
    maxPaddles,
  });

  // Calculate profile completeness (0-100%)
  useEffect(() => {
    let filledFields = 0;
    let totalFields = 0;

    // Play context (6 fields)
    totalFields += 6;
    if (profile.play?.rating) filledFields++;
    if (profile.play?.skill_level) filledFields++;
    if (profile.play?.years_playing) filledFields++;
    if (profile.play?.tournament_level) filledFields++;
    if (profile.play?.format) filledFields++;
    if (profile.play?.hand_dominance) filledFields++;

    // Style (2 fields)
    totalFields += 2;
    if (profile.style?.styles && profile.style.styles.length > 0) filledFields++;
    if (profile.style?.priority) filledFields++;

    // Physical (3 fields)
    totalFields += 3;
    if (profile.physical?.arm_sensitivity !== undefined) filledFields++;
    if (profile.physical?.weight_tolerance) filledFields++;
    if (profile.physical?.grip_size) filledFields++;

    // Setup (2 fields)
    totalFields += 2;
    if (profile.setup?.pain_points && profile.setup.pain_points.length > 0) filledFields++;
    if (profile.setup?.current_paddle_id !== undefined) filledFields++;

    // Environment (3 fields)
    totalFields += 3;
    if (profile.env?.indoor_pct !== undefined) filledFields++;
    if (profile.env?.outdoor_pct !== undefined) filledFields++;
    if (profile.env?.common_opponents && profile.env.common_opponents.length > 0) filledFields++;

    // Preferences (2 fields)
    totalFields += 2;
    if (profile.prefs?.budget) filledFields++;
    if (profile.prefs?.customization) filledFields++;

    // Aspirations (3 fields)
    totalFields += 3;
    if (profile.aspirations?.primary_goal) filledFields++;
    if (profile.aspirations?.target_rating) filledFields++;
    if (profile.aspirations?.timeframe) filledFields++;

    const percentage = Math.round((filledFields / totalFields) * 100);
    setCompleteness(percentage);
  }, [profile]);

  if (completeness < 20) {
    return (
      <Card className={className}>
        <CardHeader className="flex">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            Paddle Recommendations
          </CardTitle>
          <CardDescription>
            Fill out at least 20% of your profile to see personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Profile Completeness: {completeness}%
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Top Recommendations
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            {completeness}% Match Confidence
          </Badge>
        </div>
        <CardDescription>
          Based on your profile, here are your best matches so far
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: maxPaddles }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : topPaddles.length > 0 ? (
          // Paddle recommendations
          topPaddles.map((paddle, index) => (
            <div
              key={paddle.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              {index === 0 && (
                <Award className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              )}
              {index !== 0 && (
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {paddle.company} {paddle.paddleName}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {paddle.averageRating && (
                    <Badge variant="outline" className="text-xs">
                      ⭐ {paddle.averageRating.toFixed(1)}
                    </Badge>
                  )}
                  {paddle.price && (
                    <span className="text-xs text-muted-foreground">
                      ${paddle.price}
                    </span>
                  )}
                  {paddle.coreThickness && (
                    <span className="text-xs text-muted-foreground">
                      {paddle.coreThickness}mm
                    </span>
                  )}
                </div>
                {paddle.shape && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {paddle.shape}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            No recommendations available yet. Keep filling out your profile!
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Recommendations update in real-time as you answer questions
        </div>
      </CardContent>
    </Card>
  );
}
