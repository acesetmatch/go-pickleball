'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Target, Trophy, Star } from 'lucide-react';
import { useOnboardingStore } from '@/store/onboarding';

interface PlayerProfile {
  id: string;
  name: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  timeSaved: string;
  profile: {
    play: any;
    style: any;
    physical: any;
    setup: any;
    env: any;
    prefs: any;
    aspirations: any;
  };
}

const QUICK_PROFILES: PlayerProfile[] = [
  {
    id: 'beginner',
    name: 'Beginner Learning',
    icon: <Zap className="w-6 h-6" />,
    badge: 'Most Popular',
    description: 'New to pickleball, learning fundamentals and looking for a forgiving paddle',
    timeSaved: 'Saves 4 min',
    profile: {
      play: {
        rating: 2.5,
        skill_level: 'beginner',
        years_playing: '<1',
        tournament_level: 'none'
      },
      style: {
        styles: ['soft_game', 'all_court'],
        priority: 'control'
      },
      physical: {
        arm_sensitivity: false,
        weight_tolerance: 'medium',
        grip_size: '4.25'
      },
      setup: {
        pain_points: ['consistency', 'power'],
        current_paddle_id: null
      },
      env: {
        indoor_pct: 50,
        outdoor_pct: 50,
        common_opponents: ['recreational']
      },
      prefs: {
        budget: {
          min: 50,
          max: 150
        },
        customization: 'none'
      },
      aspirations: {
        primary_goal: 'consistency',
        target_rating: 3.0,
        timeframe: '6months'
      }
    }
  },
  {
    id: 'recreational',
    name: 'Recreational Player',
    icon: <Target className="w-6 h-6" />,
    badge: 'Great for Most',
    description: '1-3 years experience, play 2-3x per week, developing consistent game',
    timeSaved: 'Saves 4 min',
    profile: {
      play: {
        rating: 3.5,
        skill_level: 'intermediate',
        years_playing: '1-3',
        tournament_level: 'local'
      },
      style: {
        styles: ['all_court', 'reset_first'],
        priority: 'balanced'
      },
      physical: {
        arm_sensitivity: false,
        weight_tolerance: 'medium',
        grip_size: '4.25'
      },
      setup: {
        pain_points: ['power', 'spin'],
        current_paddle_id: null
      },
      env: {
        indoor_pct: 60,
        outdoor_pct: 40,
        common_opponents: ['recreational', 'competitive']
      },
      prefs: {
        budget: {
          min: 100,
          max: 200
        },
        customization: 'basic'
      },
      aspirations: {
        primary_goal: 'power',
        target_rating: 4.0,
        timeframe: '1year'
      }
    }
  },
  {
    id: 'competitive',
    name: 'Competitive Tournament',
    icon: <Trophy className="w-6 h-6" />,
    badge: 'Serious Players',
    description: '3+ years, tournament player, looking for performance edge',
    timeSaved: 'Saves 3 min',
    profile: {
      play: {
        rating: 4.5,
        skill_level: 'advanced',
        years_playing: '3-5',
        tournament_level: 'regional'
      },
      style: {
        styles: ['aggressive', 'hand_speed'],
        priority: 'power'
      },
      physical: {
        arm_sensitivity: false,
        weight_tolerance: 'heavy',
        grip_size: '4.375'
      },
      setup: {
        pain_points: ['spin', 'touch'],
        current_paddle_id: null
      },
      env: {
        indoor_pct: 70,
        outdoor_pct: 30,
        common_opponents: ['competitive', 'advanced']
      },
      prefs: {
        budget: {
          min: 150,
          max: 300
        },
        customization: 'advanced'
      },
      aspirations: {
        primary_goal: 'spin',
        target_rating: 5.0,
        timeframe: '1year'
      }
    }
  },
  {
    id: 'pro',
    name: 'Elite/Pro Level',
    icon: <Star className="w-6 h-6" />,
    badge: 'Top 1%',
    description: 'Professional or semi-pro, prize money winner, specific paddle requirements',
    timeSaved: 'Saves 2 min',
    profile: {
      play: {
        rating: 5.5,
        skill_level: 'expert',
        years_playing: '5+',
        tournament_level: 'national'
      },
      style: {
        styles: ['aggressive', 'flicker', 'hand_speed'],
        priority: 'precision'
      },
      physical: {
        arm_sensitivity: false,
        weight_tolerance: 'custom',
        grip_size: '4.5'
      },
      setup: {
        pain_points: ['fine_tuning'],
        current_paddle_id: null
      },
      env: {
        indoor_pct: 80,
        outdoor_pct: 20,
        common_opponents: ['pro', 'elite']
      },
      prefs: {
        budget: {
          min: 200,
          max: 500
        },
        customization: 'extensive'
      },
      aspirations: {
        primary_goal: 'performance',
        target_rating: 6.0,
        timeframe: '6months'
      }
    }
  }
];

interface QuickStartProfilesProps {
  onSelect: (profileId: string) => void;
  onSkip: () => void;
}

export default function QuickStartProfiles({ onSelect, onSkip }: QuickStartProfilesProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { profile, setPlayContext, setStyle, setPhysical, setSetupPain, setEnvironment, setPreferences, setAspirations } = useOnboardingStore();

  const handleSelect = (profileId: string) => {
    setSelectedId(profileId);
    const selectedProfile = QUICK_PROFILES.find(p => p.id === profileId);

    if (selectedProfile) {
      // Pre-fill the store with selected profile data
      setPlayContext(selectedProfile.profile.play);
      setStyle(selectedProfile.profile.style);
      setPhysical(selectedProfile.profile.physical);
      setSetupPain(selectedProfile.profile.setup);
      setEnvironment(selectedProfile.profile.env);
      setPreferences(selectedProfile.profile.prefs);
      setAspirations(selectedProfile.profile.aspirations);
    }
  };

  const handleContinue = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Quick Start</h2>
        <p className="text-muted-foreground text-lg">
          Choose a profile to pre-fill your answers, or skip to answer manually
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUICK_PROFILES.map((profile) => (
          <Card
            key={profile.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedId === profile.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSelect(profile.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {profile.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {profile.badge}
                    </Badge>
                  </div>
                </div>
                {selectedId === profile.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-sm">
                {profile.description}
              </CardDescription>
              <div className="flex items-center gap-2 text-sm text-primary">
                <Zap className="w-4 h-4" />
                <span className="font-medium">{profile.timeSaved}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedId}
          className="w-full sm:w-auto"
        >
          Continue with Selected Profile
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onSkip}
          className="w-full sm:w-auto"
        >
          Skip - Answer Manually
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don't worry - you can modify any answers after selecting a profile
      </p>
    </div>
  );
}
