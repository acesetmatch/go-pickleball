import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { RankingInput } from '../shared/RankingInput';
import { PresetButtons } from '../shared/PresetSlider';

const STYLE_OPTIONS = [
  {
    id: 'aggressive',
    label: 'Aggressive Finishing',
    description: 'Poach, put-away, high ball kill shots'
  },
  {
    id: 'all_court',
    label: 'All Court',
    description: 'Balance soft game, drives, flicks'
  },
  {
    id: 'reset_first',
    label: 'Reset First',
    description: 'Prioritize control and patience over power'
  },
  {
    id: 'hand_speed',
    label: 'Hand Speed',
    description: 'Quick reactions, fast exchanges at the net'
  },
  {
    id: 'singles',
    label: 'Singles Specialist',
    description: 'Court coverage and endurance focused'
  },
  {
    id: 'driving_banger',
    label: 'Driving Banger',
    description: 'Power drives and aggressive baseline play'
  },
  {
    id: 'soft_game',
    label: 'Soft Game',
    description: 'Heavy emphasis on dinking, resets, and patience'
  },
  {
    id: 'flicker',
    label: 'Flicks / Speed-ups',
    description: 'Disguising flicks from dinks and speed-ups at the kitchen'
  }
];

export default function StepStyle() {
  const { profile, setStyle } = useOnboardingStore();
  const style = profile.style || { styles: [], priority: 'control' };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Play Style & Tendencies</CardTitle>
        <CardDescription>
          Describe your playing style and strategic preferences (select up to 2)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Playing Styles - Using RankingInput */}
        <RankingInput
          label="Playing Styles"
          description="Rank your top play styles in order of importance (select 1-3)"
          options={STYLE_OPTIONS}
          value={style.styles || []}
          onChange={(rankedStyles) => setStyle({ styles: rankedStyles as any })}
          minSelections={1}
          maxSelections={3}
        />

        {/* Priority - Using PresetButtons */}
        <PresetButtons
          label="What's most important in your game?"
          value={style.priority || ''}
          onChange={(value) => setStyle({ priority: value })}
          options={[
            { value: 'power', label: 'Power', description: 'Hit hard, finish points' },
            { value: 'control', label: 'Control', description: 'Placement & consistency' },
            { value: 'spin', label: 'Spin', description: 'Shape shots & angles' },
            { value: 'balanced', label: 'Balanced', description: 'Mix of all' }
          ]}
        />
      </CardContent>
    </Card>
  );
}
