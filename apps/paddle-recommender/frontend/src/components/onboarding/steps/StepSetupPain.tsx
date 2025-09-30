import React, { useState } from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_PADDLES = [
    { id: 'selkirk-amped-s2', name: 'Selkirk Amped S2' },
    { id: 'joola-ben-johns-hyperion', name: 'JOOLA Ben Johns Hyperion' },
    { id: 'paddletek-bantam-ex-l', name: 'Paddletek Bantam EX-L' },
    { id: 'engage-pursuit-mx', name: 'Engage Pursuit MX' },
    { id: 'head-radical-elite', name: 'HEAD Radical Elite' },
    { id: 'yonex-ezone-100', name: 'Yonex EZONE 100' },
    { id: 'wilson-energy-pro', name: 'Wilson Energy Pro' },
    { id: 'babolat-rbel', name: 'Babolat RBEL' },
    { id: 'prince-response-pro', name: 'Prince Response Pro' },
    { id: 'gamma-compass', name: 'Gamma Compass' },
    { id: 'onix-z5-graphite', name: 'Onix Z5 Graphite' },
    { id: 'franklin-x-40', name: 'Franklin X-40' },
    { id: 'prokennex-ovation-flight', name: 'ProKennex Ovation Flight' },
    { id: 'electrum-model-e', name: 'Electrum Model E' },
    { id: 'gearbox-gx5', name: 'Gearbox GX5' }
];

const PAIN_POINTS = [
    { value: 'resets_short', label: 'Resets Fall Short', description: 'Difficulty getting soft shots deep enough' },
    { value: 'popups', label: 'Pop-ups', description: 'Ball comes off paddle too high on blocks/resets' },
    { value: 'blocks_shallow', label: 'Blocks Too Shallow', description: 'Hard shots bounce back short, easy attacks' },
    { value: 'low_spin', label: 'Not Enough Spin', description: 'Want more topspin or slice on shots' },
    { value: 'wrist_slow', label: 'Wrist/Hand Speed', description: 'Paddle feels slow through quick exchanges' },
    { value: 'vibration', label: 'Vibration/Comfort', description: 'Paddle stings or causes arm discomfort' }
];

export default function StepSetupPain() {
    const { profile, setSetupPain } = useOnboardingStore();
    const setup = profile.setup || { pain_points: [] };
    const [paddleOpen, setPaddleOpen] = useState(false);

    const selectedPaddle = MOCK_PADDLES.find(paddle => paddle.id === setup.current_paddle_id);

    const handlePaddleSelect = (paddleId: string) => {
        setSetupPain({ current_paddle_id: paddleId });
        setPaddleOpen(false);
    };

    const handlePainPointToggle = (painPoint: string, checked: boolean) => {
        const currentPainPoints = setup.pain_points || [];
        let newPainPoints;
        
        if (checked) {
            if (currentPainPoints.length < 2) {
                newPainPoints = [...currentPainPoints, painPoint];
            } else {
                return; // Don't allow more than 2 pain points
            }
        } else {
            newPainPoints = currentPainPoints.filter(p => p !== painPoint);
        }
        
        setSetupPain({ pain_points: newPainPoints });
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Current Setup & Pain Points</CardTitle>
                <CardDescription>
                    What paddle do you use now and what frustrates you?
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Paddle - Searchable Select */}
                <div className="space-y-2">
                    <Label>Current Paddle (optional)</Label>
                    <Popover open={paddleOpen} onOpenChange={setPaddleOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={paddleOpen}
                                className="w-full justify-between"
                            >
                                {selectedPaddle ? selectedPaddle.name : "Search for your paddle..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Search paddles..." />
                                <CommandList>
                                    <CommandEmpty>No paddle found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value=""
                                            onSelect={() => {
                                                setSetupPain({ current_paddle_id: null });
                                                setPaddleOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    !setup.current_paddle_id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            None / Other
                                        </CommandItem>
                                        {MOCK_PADDLES.map((paddle) => (
                                            <CommandItem
                                                key={paddle.id}
                                                value={paddle.name}
                                                onSelect={() => handlePaddleSelect(paddle.id)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        setup.current_paddle_id === paddle.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {paddle.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <p className="text-sm text-muted-foreground">
                        What paddle are you currently using? Search by brand or model.
                    </p>
                </div>

                {/* Pain Points */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label>What frustrates you most?</Label>
                        <p className="text-sm text-muted-foreground">
                            Pick up to two—this guides tuning.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {PAIN_POINTS.map((painOption) => (
                            <div key={painOption.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                                <Checkbox
                                    id={painOption.value}
                                    checked={setup.pain_points?.includes(painOption.value) || false}
                                    onCheckedChange={(checked) => handlePainPointToggle(painOption.value, checked as boolean)}
                                    disabled={!setup.pain_points?.includes(painOption.value) && (setup.pain_points?.length || 0) >= 2}
                                />
                                <div className="flex-1">
                                    <Label htmlFor={painOption.value} className="font-medium">
                                        {painOption.label}
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {painOption.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Selected: {setup.pain_points?.length || 0}/2 pain points
                    </p>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (optional)</Label>
                    <Textarea
                        id="notes"
                        value={setup.notes || ''}
                        onChange={(e) => setSetupPain({ notes: e.target.value })}
                        placeholder="Any other details about your current setup or what you'd like to improve..."
                        rows={3}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
