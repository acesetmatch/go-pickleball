import React from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { PresetButtons } from '../shared/PresetSlider';

const GRIP_SIZES = [
    { value: '4_1/8', label: '4 1/8"', description: 'Small' },
    { value: '4_1/4', label: '4 1/4"', description: 'Small-Medium' },
    { value: '4_3/8', label: '4 3/8"', description: 'Medium' },
    { value: '4_1/2', label: '4 1/2"', description: 'Medium-Large' },
    { value: '4_5/8', label: '4 5/8"', description: 'Large' },
    { value: '4_3/4', label: '4 3/4"', description: 'Extra Large' }
];

export default function StepPhysical() {
    const { profile, setPhysical, shouldShowArmSensitivityDetails } = useOnboardingStore();
    const physical = profile.physical || {} as any;
    const showArmDetails = shouldShowArmSensitivityDetails();

    const handleGripSize = (size: string) => {
        setPhysical({ grip_size: size as '4' | '4_1/8' | '4_1/4' | '4_3/8' | '4_1/2' | '4_5/8' | '4_3/4' });
    };

    const validateNumericInput = (value: string, min: number, max: number) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= min && num <= max ? num : undefined;
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Physical Factors</CardTitle>
                <CardDescription>
                    Share physical considerations that affect paddle choice
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Arm Sensitivity */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="arm-sensitivity">Arm/Elbow Sensitivity</Label>
                            <p className="text-sm text-muted-foreground">
                                Do you have tennis elbow, shoulder issues, or arm pain?
                            </p>
                        </div>
                        <Switch
                            id="arm-sensitivity"
                            checked={physical.arm_sensitivity || false}
                            onCheckedChange={(checked) => setPhysical({ arm_sensitivity: checked })}
                        />
                    </div>

                    {showArmDetails && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                We'll recommend paddles with lower vibration, softer cores, and balanced weight distribution to reduce arm strain.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Grip Size */}
                <div className="space-y-3">
                    <Label>Grip Size (optional)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {GRIP_SIZES.map((grip) => (
                            <Button
                                key={grip.value}
                                variant={physical.grip_size === grip.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleGripSize(grip.value)}
                                className="flex flex-col h-auto py-2 px-3"
                            >
                                <span className="font-medium">{grip.label}</span>
                                <span className="text-xs text-muted-foreground">{grip.description}</span>
                            </Button>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Handle circumference in inches, like tennis racquet grips. Most players use 4 1/4" to 4 3/8".
                    </p>
                </div>

                {/* Handle Preference */}
                <div className="space-y-3">
                    <Label>Handle Length Preference (optional)</Label>
                    <RadioGroup
                        value={physical.handle_pref || ''}
                        onValueChange={(value) => setPhysical({
                            handle_pref: value as 'short' | 'standard' | 'long' || undefined
                        })}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="short" id="handle-short" />
                            <Label htmlFor="handle-short">Short (4.5" - 4.75") - for one handed backhands</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="standard" id="handle-standard" />
                            <Label htmlFor="handle-standard">Standard (5" - 5.25") - for medium size or small hands with two handed backhands or large hands with one</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="long" id="handle-long" />
                            <Label htmlFor="handle-long">Long (5.5" - 6") - for larger hands and/or two handed backhands</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Height - Commented out for now */}
                {/* <div className="space-y-3">
                    <Label>Height (optional)</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="height-ft" className="text-sm text-muted-foreground">Feet</Label>
                            <Input
                                id="height-ft"
                                type="number"
                                min="3"
                                max="8"
                                value={physical.height_ft || ''}
                                onChange={(e) => setPhysical({ 
                                    height_ft: validateNumericInput(e.target.value, 3, 8)
                                })}
                                placeholder="5"
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="height-in" className="text-sm text-muted-foreground">Inches</Label>
                            <Input
                                id="height-in"
                                type="number"
                                min="0"
                                max="11"
                                value={physical.height_in || ''}
                                onChange={(e) => setPhysical({ 
                                    height_in: validateNumericInput(e.target.value, 0, 11)
                                })}
                                placeholder="8"
                            />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Your height (e.g., 5'8"). Helps with reach and paddle length recommendations.
                    </p>
                </div> */}

                {/* Wingspan - Commented out for now */}
                {/* <div className="space-y-3">
                    <Label>Wingspan (optional)</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="wingspan-ft" className="text-sm text-muted-foreground">Feet</Label>
                            <Input
                                id="wingspan-ft"
                                type="number"
                                min="3"
                                max="8"
                                value={physical.wingspan_ft || ''}
                                onChange={(e) => setPhysical({ 
                                    wingspan_ft: validateNumericInput(e.target.value, 3, 8)
                                })}
                                placeholder="5"
                            />
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="wingspan-in" className="text-sm text-muted-foreground">Inches</Label>
                            <Input
                                id="wingspan-in"
                                type="number"
                                min="0"
                                max="11"
                                value={physical.wingspan_in || ''}
                                onChange={(e) => setPhysical({ 
                                    wingspan_in: validateNumericInput(e.target.value, 0, 11)
                                })}
                                placeholder="10"
                            />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Arm span fingertip to fingertip (e.g., 5'10"). Usually close to your height.
                    </p>
                </div> */}

                {/* Weight Tolerance - Using PresetButtons */}
                <PresetButtons
                    label="Weight Tolerance"
                    description="What paddle weight feels best to you?"
                    value={physical.weight_tolerance || ''}
                    onChange={(value) => setPhysical({ weight_tolerance: value })}
                    options={[
                        { value: 'light', label: 'Light', description: '7.0-7.8 oz - Less fatigue, quicker hands' },
                        { value: 'medium', label: 'Medium', description: '7.8-8.2 oz - Balanced for most players' },
                        { value: 'heavy', label: 'Heavy', description: '8.2+ oz - More power & stability' }
                    ]}
                />
            </CardContent>
        </Card>
    );
}
