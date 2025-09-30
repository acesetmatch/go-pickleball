import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRIMARY_GOALS = [
    { value: 'power', label: 'Power', description: 'Hit harder shots, finish points more aggressively' },
    { value: 'control', label: 'Control', description: 'Better placement, more precise shot-making' },
    { value: 'consistency', label: 'Consistency', description: 'Fewer unforced errors, more reliable shots' },
    { value: 'spin', label: 'Spin', description: 'More topspin, slice, and shot variety' },
    { value: 'comfort', label: 'Comfort', description: 'Reduce arm fatigue, prevent injury, play longer' }
];

export default function StepAspirations() {
    const { profile, setAspirations } = useOnboardingStore();
    const aspirations = profile.aspirations || {};

    const validateTargetRating = (value: string): number | undefined => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 2.5 && num <= 6.0 ? num : undefined;
    };

    const selectedGoal = PRIMARY_GOALS.find(goal => goal.value === aspirations.primary_goal);

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Aspirations / Goals</CardTitle>
                <CardDescription>
                    What should improve first? We'll bias for that. Your paddle is a tool to unlock your potential - let's find the right one for your journey.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Primary Goal Select */}
                <div className="space-y-3">
                    <Label>Primary Goal</Label>
                    <Select
                        value={aspirations.primary_goal || ''}
                        onValueChange={(value) => setAspirations({ 
                            primary_goal: value as 'power' | 'control' | 'consistency' | 'spin' | 'comfort' 
                        })}
                    >
                        <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            <SelectValue placeholder="Select your main improvement goal" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRIMARY_GOALS.map((goal) => (
                                <SelectItem key={goal.value} value={goal.value}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{goal.label}</span>
                                        <span className="text-xs text-muted-foreground">{goal.description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedGoal && (
                        <p className="text-sm text-muted-foreground">
                            <strong>{selectedGoal.label}:</strong> {selectedGoal.description}
                        </p>
                    )}
                </div>

                {/* Target Rating */}
                <div className="space-y-2">
                    <Label htmlFor="target-rating">Target Rating (optional)</Label>
                    <Input
                        id="target-rating"
                        type="number"
                        min="2.5"
                        max="6.0"
                        step="0.1"
                        value={aspirations.target_rating || ''}
                        onChange={(e) => setAspirations({ 
                            target_rating: validateTargetRating(e.target.value)
                        })}
                        placeholder="e.g., 4.0"
                    />
                    <p className="text-sm text-muted-foreground">
                        What rating are you working toward? (2.5 - 6.0)
                    </p>
                </div>

                {/* Goal-specific tip */}
                {aspirations.primary_goal && (
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            <strong>Focus on {selectedGoal?.label.toLowerCase()}:</strong> We'll recommend paddles that excel in this area. 
                            {aspirations.primary_goal === 'power' && ' Look for stiffer faces and longer handles.'}
                            {aspirations.primary_goal === 'control' && ' Expect softer faces and balanced weight distribution.'}
                            {aspirations.primary_goal === 'consistency' && ' We\'ll prioritize forgiving sweet spots and stable designs.'}
                            {aspirations.primary_goal === 'spin' && ' Textured surfaces and flexible faces will be highlighted.'}
                            {aspirations.primary_goal === 'comfort' && ' Vibration dampening and lighter weights will be prioritized.'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
