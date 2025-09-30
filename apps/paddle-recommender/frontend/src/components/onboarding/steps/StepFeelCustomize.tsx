import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export default function StepFeelCustomize() {
  const { profile, setPreferences } = useOnboardingStore();
  const prefs = profile.prefs || { feel: undefined, customize: undefined };

  const handleFeelChange = (value: 'power' | 'control' | 'balanced') => {
    setPreferences({ feel: value });
  };

  const handleCustomizeChange = (value: string) => {
    const customize = value === 'yes_custom';
    setPreferences({ customize });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Paddle Feel & Customization</CardTitle>
        <CardDescription>
          Tell us about your paddle preferences and customization habits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section 1: Paddle Feel Preference */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Paddle Feel Preference</Label>
          <TooltipProvider>
            <RadioGroup
              value={prefs.feel || ''}
              onValueChange={handleFeelChange}
              className="space-y-3"
              aria-label="Paddle feel preference"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="power" id="feel-power" />
                <div className="flex-1 flex items-center gap-2">
                  <Label htmlFor="feel-power" className="font-medium cursor-pointer">
                    More Power
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Prefer paddles that help generate more pace and drive through shots</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="control" id="feel-control" />
                <div className="flex-1 flex items-center gap-2">
                  <Label htmlFor="feel-control" className="font-medium cursor-pointer">
                    More Control
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Prefer paddles that offer better touch, placement, and shot precision</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="balanced" id="feel-balanced" />
                <div className="flex-1 flex items-center gap-2">
                  <Label htmlFor="feel-balanced" className="font-medium cursor-pointer">
                    Balanced
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Want a good mix of both power and control characteristics</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </RadioGroup>
          </TooltipProvider>
        </div>

        {/* Section 2: Customization Habit */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Customization Preference</Label>
            <p className="text-sm text-muted-foreground">
              Do you typically like to add lead tape to customize the weight and balance of your paddle, or do you want a paddle that plays optimally in stock form?
            </p>
          </div>
          
          <RadioGroup
            value={prefs.customize === true ? 'yes_custom' : prefs.customize === false ? 'no_stock' : ''}
            onValueChange={handleCustomizeChange}
            className="space-y-3"
            aria-label="Paddle customization preference"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="yes_custom" id="custom-yes" />
              <Label htmlFor="custom-yes" className="font-medium cursor-pointer flex-1">
                Yes, I like to customize with lead tape
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="no_stock" id="custom-no" />
              <Label htmlFor="custom-no" className="font-medium cursor-pointer flex-1">
                No, I want stock performance
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
