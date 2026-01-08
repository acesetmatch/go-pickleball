import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ProgressiveSection } from '../shared/ProgressiveSection';
import { TradeoffSlider, PresetButtons } from '../shared/PresetSlider';

export default function StepEnvironment() {
    const { profile, setEnvironment, shouldShowWindQuestions } = useOnboardingStore();
    const env = profile.env || { indoor_pct: 50, outdoor_pct: 50, common_opponents: [] };
    const showWindQuestions = shouldShowWindQuestions();

    const handleIndoorPctChange = (value: number[]) => {
        const indoorPct = value[0];
        const outdoorPct = 100 - indoorPct;
        setEnvironment({
            indoor_pct: indoorPct,
            outdoor_pct: outdoorPct
        });
    };

    const handleOpponentsChange = (value: string[]) => {
        setEnvironment({ common_opponents: value });
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Environment & Opponents</CardTitle>
                <CardDescription>
                    Where you play affects paddle choice - indoor courts favor control, outdoor courts need power and wind resistance
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Core Questions */}
                <ProgressiveSection
                    title="Additional Environment Details"
                    description="Help us fine-tune recommendations based on playing conditions"
                    accuracyBoost="+10%"
                    coreQuestions={
                        <>
                            {/* Indoor/Outdoor Split */}
                            <div className="space-y-4">
                                <Label>Playing Environment</Label>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-lg font-medium">
                                        <span>Indoor: {env.indoor_pct || 50}%</span>
                                        <span>Outdoor: {env.outdoor_pct || 50}%</span>
                                    </div>
                                    <div className="px-3">
                                        <Slider
                                            value={[env.indoor_pct || 50]}
                                            onValueChange={handleIndoorPctChange}
                                            min={0}
                                            max={100}
                                            step={5}
                                            className="w-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            aria-valuetext={`${env.indoor_pct || 50}% indoor, ${env.outdoor_pct || 50}% outdoor play`}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>All Outdoor</span>
                                        <span>50/50</span>
                                        <span>All Indoor</span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Indoor courts play faster with consistent conditions. Outdoor courts have wind, sun, and varying surfaces.
                                </p>
                            </div>

                            {/* Common Opponents - Segmented Control */}
                            <div className="space-y-4">
                                <Label>Common Opponent Styles</Label>
                                <ToggleGroup
                                    type="multiple"
                                    value={env.common_opponents || []}
                                    onValueChange={handleOpponentsChange}
                                    className="grid grid-cols-1 gap-2"
                                >
                                    <ToggleGroupItem
                                        value="bangers"
                                        className="flex items-start space-x-3 p-6 border-2 rounded-lg min-h-[80px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                    >
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-base">Bangers</div>
                                            <p className="text-sm opacity-80 mt-2">
                                                Power players who hit hard from the baseline
                                            </p>
                                        </div>
                                    </ToggleGroupItem>

                                    <ToggleGroupItem
                                        value="dinkers"
                                        className="flex items-start space-x-3 p-6 border-2 rounded-lg min-h-[80px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                    >
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-base">Dinkers</div>
                                            <p className="text-sm opacity-80 mt-2">
                                                Soft game specialists who focus on placement and patience
                                            </p>
                                        </div>
                                    </ToggleGroupItem>

                                    <ToggleGroupItem
                                        value="mixed"
                                        className="flex items-start space-x-3 p-6 border-2 rounded-lg min-h-[80px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                    >
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-base">Mixed Styles</div>
                                            <p className="text-sm opacity-80 mt-2">
                                                Variety of playing styles and strategies
                                            </p>
                                        </div>
                                    </ToggleGroupItem>
                                </ToggleGroup>
                                <p className="text-sm text-muted-foreground">
                                    Select all that apply. This helps us recommend paddles that match up well against these styles.
                                </p>
                            </div>
                        </>
                    }
                    detailedQuestions={
                        <>
                            {/* Wind Sensitivity - Only show for outdoor players */}
                            {showWindQuestions && (
                                <PresetButtons
                                    label="Wind Conditions"
                                    description="How often do you play in windy conditions?"
                                    value={env.wind_sensitivity || ''}
                                    onChange={(value) => setEnvironment({ wind_sensitivity: value })}
                                    options={[
                                        { value: 'low', label: 'Rarely', description: 'Calm days only' },
                                        { value: 'medium', label: 'Sometimes', description: 'Occasional wind' },
                                        { value: 'high', label: 'Often', description: 'Frequently windy' }
                                    ]}
                                />
                            )}

                            {/* Court Surface Preference */}
                            <PresetButtons
                                label="Preferred Court Surface"
                                description="What surfaces do you play on most?"
                                value={env.surface || ''}
                                onChange={(value) => setEnvironment({ surface: value })}
                                options={[
                                    { value: 'concrete', label: 'Concrete', description: 'Hard surface' },
                                    { value: 'asphalt', label: 'Asphalt', description: 'Standard outdoor' },
                                    { value: 'sport_court', label: 'Sport Court', description: 'Cushioned surface' },
                                    { value: 'wood', label: 'Wood', description: 'Indoor gyms' }
                                ]}
                            />
                        </>
                    }
                />
            </CardContent>
        </Card>
    );
}
