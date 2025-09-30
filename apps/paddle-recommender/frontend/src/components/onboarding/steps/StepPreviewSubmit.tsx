import React from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, User, Target, Dumbbell, AlertCircle, MapPin, DollarSign, Trophy, Video, Loader2 } from 'lucide-react';

export default function StepPreviewSubmit() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, video, reset } = useOnboardingStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Calculate match confidence based on profile completeness
  const calculateMatchConfidence = () => {
    let score = 0;
    const maxScore = 7;

    // Check each section for completeness
    if (profile.play?.rating && profile.play?.plays && profile.play?.competitive) score++;
    if (profile.style?.styles && profile.style.styles.length > 0) score++;
    if (profile.physical?.arm_sensitivity !== undefined && profile.physical?.weight_tolerance) score++;
    if (profile.setup?.current_paddle_id || (profile.setup?.pain_points && profile.setup.pain_points.length > 0)) score++;
    if (profile.env?.indoor_pct !== undefined && profile.env?.common_opponents) score++;
    if (profile.prefs?.budget?.min !== undefined && profile.prefs?.budget?.max !== undefined) score++;
    if (profile.aspirations?.primary_goal) score++;

    // Determine confidence level
    if (video && score >= 6) return { level: 'High', color: 'bg-green-500', description: 'Full profile + video analysis' };
    if (score >= 5) return { level: 'Medium', color: 'bg-yellow-500', description: 'Complete profile data' };
    return { level: 'Low', color: 'bg-red-500', description: 'Basic profile information' };
  };

  const matchConfidence = calculateMatchConfidence();

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double-submit
    
    setIsSubmitting(true);
    
    try {
      // Prepare payload
      const payload = {
        profile,
        video: video || null,
        timestamp: new Date().toISOString(),
        confidence: matchConfidence.level.toLowerCase()
      };

      // POST to recommender API
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Route to results with payload
      router.push(`/results?id=${result.recommendation_id}`);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Unable to process your profile. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    reset();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Preview & Submit</span>
          <Badge className={`${matchConfidence.color} text-white`}>
            {matchConfidence.level} Confidence
          </Badge>
        </CardTitle>
        <CardDescription>
          {matchConfidence.description} • Review your profile before we generate recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Cards */}
        <div className="grid gap-4">
          {/* 1. Play Context Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              <h3 className="font-medium">1. Skill Level & Context</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Rating: <span className="font-medium">{profile.play?.rating || 'Not set'}</span></p>
              <p>Plays: <span className="font-medium">{profile.play?.plays || 'Not set'}</span></p>
              <p>Level: <span className="font-medium">{profile.play?.competitive || 'Not set'}</span></p>
            </div>
          </Card>

          {/* 2. Style Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              <h3 className="font-medium">2. Play Style</h3>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {(profile.style?.styles || []).map(style => (
                  <Badge key={style} variant="secondary">{style}</Badge>
                ))}
                {(profile.style?.styles?.length || 0) === 0 && (
                  <span className="text-sm text-muted-foreground">No styles selected</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Priority: <span className="font-medium">{profile.style?.priority || 'Not set'}</span>
              </p>
            </div>
          </Card>

          {/* 3. Physical Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4" />
              <h3 className="font-medium">3. Physical Factors</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Arm sensitivity: <span className="font-medium">{profile.physical?.arm_sensitivity ? 'Yes' : 'No'}</span></p>
              <p>Weight tolerance: <span className="font-medium">{profile.physical?.weight_tolerance || 'Not set'}</span></p>
              {profile.physical?.height_cm && <p>Height: <span className="font-medium">{profile.physical.height_cm}cm</span></p>}
              {profile.physical?.grip_size && <p>Grip size: <span className="font-medium">{profile.physical.grip_size}</span></p>}
            </div>
          </Card>

          {/* 4. Setup & Pain Points Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              <h3 className="font-medium">4. Current Setup & Pain Points</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current paddle: <span className="font-medium">{profile.setup?.current_paddle_id || 'Not specified'}</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {(profile.setup?.pain_points || []).map(pain => (
                  <Badge key={pain} variant="destructive">{pain}</Badge>
                ))}
                {(profile.setup?.pain_points?.length || 0) === 0 && (
                  <span className="text-sm text-muted-foreground">No pain points selected</span>
                )}
              </div>
            </div>
          </Card>

          {/* 5. Environment Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4" />
              <h3 className="font-medium">5. Environment</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Indoor: <span className="font-medium">{profile.env?.indoor_pct || 50}%</span> | Outdoor: <span className="font-medium">{profile.env?.outdoor_pct || 50}%</span></p>
              <div className="flex flex-wrap gap-1">
                {(profile.env?.common_opponents || []).map(opponent => (
                  <Badge key={opponent} variant="outline">{opponent}</Badge>
                ))}
                {(profile.env?.common_opponents?.length || 0) === 0 && (
                  <span className="text-sm text-muted-foreground">No opponent types selected</span>
                )}
              </div>
            </div>
          </Card>

          {/* 6. Budget & Preferences Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4" />
              <h3 className="font-medium">6. Budget & Preferences</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Budget: <span className="font-medium">${profile.prefs?.budget?.min || 0} - ${profile.prefs?.budget?.max || 200}</span></p>
              {(profile.prefs?.brand_like?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span>Likes: </span>
                  {profile.prefs?.brand_like?.map(brand => (
                    <Badge key={brand} variant="secondary">{brand}</Badge>
                  ))}
                </div>
              )}
              {(profile.prefs?.brand_avoid?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span>Avoid: </span>
                  {profile.prefs?.brand_avoid?.map(brand => (
                    <Badge key={brand} variant="outline">{brand}</Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 7. Aspirations Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4" />
              <h3 className="font-medium">7. Goals</h3>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Primary goal: <span className="font-medium">{profile.aspirations?.primary_goal || 'Not set'}</span></p>
              {profile.aspirations?.target_rating && (
                <p>Target rating: <span className="font-medium">{profile.aspirations.target_rating}</span></p>
              )}
            </div>
          </Card>

          {/* Video Summary Card */}
          {video && (
            <Card className="p-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-4 w-4 text-green-600" />
                <h3 className="font-medium text-green-800">Video Analysis</h3>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p>Duration: <span className="font-medium">{Math.round(video.duration_ms / 1000)}s</span></p>
                <p>Quality: <span className="font-medium">
                  {video.quality.lighting === 'ok' && video.quality.stability === 'ok' && video.quality.subject_size === 'ok' 
                    ? 'Good' : 'Needs improvement'}
                </span></p>
                <p>Storage: <span className="font-medium">{video.consent.store_video ? 'Enabled' : 'Metadata only'}</span></p>
              </div>
            </Card>
          )}
        </div>

        <Separator />

        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            size="lg" 
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Your Profile...
              </>
            ) : (
              'Get My Paddle Recommendations'
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            We'll analyze your preferences and show you the best paddle matches
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
