import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export default function StepStyle() {
  const { profile, setStyle } = useOnboardingStore();
  const style = profile.style || { styles: [], priority: 'control' };

  const handleStyleToggle = (styleValue: 'aggressive' | 'all_court' | 'reset_first' | 'hand_speed' | 'singles' | 'driving_banger' | 'soft_game' | 'flicker', checked: boolean) => {
    const currentStyles = style.styles || [];
    let newStyles;
    
    if (checked) {
      if (currentStyles.length < 2) {
        newStyles = [...currentStyles, styleValue] as ('aggressive' | 'all_court' | 'reset_first' | 'hand_speed' | 'singles' | 'driving_banger' | 'soft_game' | 'flicker')[];
      } else {
        return; // Don't allow more than 2 styles
      }
    } else {
      newStyles = currentStyles.filter(s => s !== styleValue) as ('aggressive' | 'all_court' | 'reset_first' | 'hand_speed' | 'singles' | 'driving_banger' | 'soft_game' | 'flicker')[];
    }
    
    setStyle({ styles: newStyles });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Play Style & Tendencies</CardTitle>
        <CardDescription>
          Describe your playing style and strategic preferences (select up to 2)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Playing Styles */}
        <div className="space-y-4">
          <Label>Playing Styles (select up to 2)</Label>
          <TooltipProvider>
            <div className="grid grid-cols-1 gap-3">
              {[
                { 
                  value: 'aggressive', 
                  label: 'Aggressive Finishing', 
                  description: 'Poach, put-away, high ball kill shots',
                  tooltip: 'Your goal is to finish points decisively. You excel at poaching, put-away shots, and high ball kill shots to end rallies quickly.'
                },
                { 
                  value: 'all_court', 
                  label: 'All Court', 
                  description: 'Balance soft game, drives, flicks',
                  tooltip: 'You have a well-rounded game that combines soft shots, powerful drives, and deceptive flicks. You adapt your strategy based on the situation.'
                },
                { 
                  value: 'reset_first', 
                  label: 'Reset First', 
                  description: 'Prioritize control and patience over power',
                  tooltip: 'When under pressure, you prefer to reset the ball and regain control rather than attempt risky shots.'
                },
                { 
                  value: 'hand_speed', 
                  label: 'Hand Speed', 
                  description: 'Quick reactions, fast exchanges at the net',
                  tooltip: 'You excel in fast-paced net exchanges and have quick reflexes for blocks and counter-attacks.'
                },
                { 
                  value: 'singles', 
                  label: 'Singles Specialist', 
                  description: 'Court coverage and endurance focused',
                  tooltip: 'You focus on court coverage, movement, and endurance. You prefer longer rallies and strategic positioning.'
                },
                { 
                  value: 'driving_banger', 
                  label: 'Driving Banger', 
                  description: 'Power drives and aggressive baseline play',
                  tooltip: 'You excel at hitting powerful drives from the baseline and transitioning to aggressive net play. You prefer to dictate points with pace and power.'
                },
                { 
                  value: 'soft_game', 
                  label: 'Soft Game', 
                  description: 'Heavy emphasis on dinking, resets, and patience',
                  tooltip: 'You win through attrition and consistency. You often wait for the perfect ball to attack, excelling at dinks and resets.'
                },
                { 
                  value: 'flicker', 
                  label: 'Flicks / Speed-ups', 
                  description: 'Loves disguising flicks from dinks and speed-ups at the kitchen',
                  tooltip: 'You are disruptive, catching opponents off-guard with deception and timing. You rely on surprise attacks more than raw power.'
                }
              ].map((styleOption) => (
                <div key={styleOption.value} className="flex items-start space-x-3 p-3 border rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <Checkbox
                    id={styleOption.value}
                    checked={style.styles?.includes(styleOption.value as any) || false}
                    onCheckedChange={(checked) => handleStyleToggle(styleOption.value as 'aggressive' | 'all_court' | 'reset_first' | 'hand_speed' | 'singles' | 'driving_banger' | 'soft_game' | 'flicker', checked as boolean)}
                    disabled={!style.styles?.includes(styleOption.value as any) && (style.styles?.length || 0) >= 2}
                    className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={styleOption.value} className="font-medium">
                        {styleOption.label}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{styleOption.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {styleOption.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>
          <p className="text-sm text-muted-foreground">
            Selected: {style.styles?.length || 0}/2 styles
          </p>
        </div>

        {/* Priority */}
        <div className="space-y-3">
          <Label>What's most important in your game?</Label>
          <RadioGroup
            value={style.priority || 'control'}
            onValueChange={(value: 'power' | 'control' | 'spin') => setStyle({ priority: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="power" id="power" />
              <Label htmlFor="power">Power - Hit hard, finish points quickly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="control" id="control" />
              <Label htmlFor="control">Control - Placement and consistency</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spin" id="spin" />
              <Label htmlFor="spin">Spin - Shape shots and create angles</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
