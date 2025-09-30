import React, { useState } from 'react';
import { useOnboardingStore } from '@/store/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus } from 'lucide-react';

const POPULAR_BRANDS = [
    'Selkirk', 'JOOLA', 'Paddletek', 'Engage', 'HEAD', 'Yonex', 'Wilson', 
    'Babolat', 'Prince', 'Gamma', 'Onix', 'Franklin', 'ProKennex', 
    'Electrum', 'Gearbox', 'Diadem', 'Vulcan', 'Niupipo', 'TMPR', 'Six Zero'
];

export default function StepPreferences() {
    const { profile, setPreferences } = useOnboardingStore();
    const prefs = profile.prefs || { budget: { min: 50, max: 200 } };
    
    const [brandLikeOpen, setBrandLikeOpen] = useState(false);
    const [brandAvoidOpen, setBrandAvoidOpen] = useState(false);
    const [brandLikeInput, setBrandLikeInput] = useState('');
    const [brandAvoidInput, setBrandAvoidInput] = useState('');

    const sanitizeBrand = (brand: string): string => {
        return brand.trim().replace(/[^a-zA-Z0-9\s\-&]/g, '');
    };

    const handleBudgetSliderChange = (values: number[]) => {
        const [min, max] = values;
        setPreferences({
            budget: { min, max }
        });
    };

    const handleBudgetInputChange = (field: 'min' | 'max', value: string) => {
        const numValue = parseInt(value) || 0;
        const currentBudget = prefs.budget || { min: 50, max: 200 };
        
        if (field === 'min') {
            const newMin = Math.min(numValue, currentBudget.max);
            setPreferences({
                budget: { ...currentBudget, min: newMin }
            });
        } else {
            const newMax = Math.max(numValue, currentBudget.min);
            setPreferences({
                budget: { ...currentBudget, max: newMax }
            });
        }
    };

    const addBrandLike = (brand: string) => {
        const sanitized = sanitizeBrand(brand);
        if (sanitized) {
            const currentBrands = prefs.brand_like || [];
            if (!currentBrands.includes(sanitized)) {
                setPreferences({
                    brand_like: [...currentBrands, sanitized]
                });
            }
        }
        setBrandLikeInput('');
        setBrandLikeOpen(false);
    };

    const addBrandAvoid = (brand: string) => {
        const sanitized = sanitizeBrand(brand);
        if (sanitized) {
            const currentBrands = prefs.brand_avoid || [];
            if (!currentBrands.includes(sanitized)) {
                setPreferences({
                    brand_avoid: [...currentBrands, sanitized]
                });
            }
        }
        setBrandAvoidInput('');
        setBrandAvoidOpen(false);
    };

    const removeBrandLike = (brand: string) => {
        const currentBrands = prefs.brand_like || [];
        setPreferences({
            brand_like: currentBrands.filter(b => b !== brand)
        });
    };

    const removeBrandAvoid = (brand: string) => {
        const currentBrands = prefs.brand_avoid || [];
        setPreferences({
            brand_avoid: currentBrands.filter(b => b !== brand)
        });
    };

    const budgetMin = prefs.budget?.min || 50;
    const budgetMax = prefs.budget?.max || 200;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Budget & Brand Preferences</CardTitle>
                <CardDescription>
                    Preferences don't hard-lock results; they bias them.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Budget Range - Dual Slider + Inputs */}
                <div className="space-y-4">
                    <Label>Budget Range</Label>
                    <div className="space-y-4">
                        <div className="px-3">
                            <Slider
                                value={[budgetMin, budgetMax]}
                                onValueChange={handleBudgetSliderChange}
                                min={0}
                                max={500}
                                step={10}
                                className="w-full"
                            />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>$0</span>
                            <span>$250</span>
                            <span>$500+</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="budget-min">Minimum ($)</Label>
                                <Input
                                    id="budget-min"
                                    type="number"
                                    min="0"
                                    max="500"
                                    value={budgetMin}
                                    onChange={(e) => handleBudgetInputChange('min', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="budget-max">Maximum ($)</Label>
                                <Input
                                    id="budget-max"
                                    type="number"
                                    min="0"
                                    max="500"
                                    value={budgetMax}
                                    onChange={(e) => handleBudgetInputChange('max', e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-center text-lg font-medium">
                            ${budgetMin} - ${budgetMax}
                        </p>
                    </div>
                </div>

                {/* Preferred Brands */}
                <div className="space-y-3">
                    <Label>Preferred Brands (optional)</Label>
                    <div className="flex gap-2">
                        <Popover open={brandLikeOpen} onOpenChange={setBrandLikeOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex-1 justify-start">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add preferred brand...
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                    <CommandInput 
                                        placeholder="Search brands..." 
                                        value={brandLikeInput}
                                        onValueChange={setBrandLikeInput}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            <Button 
                                                variant="ghost" 
                                                className="w-full"
                                                onClick={() => addBrandLike(brandLikeInput)}
                                                disabled={!brandLikeInput.trim()}
                                            >
                                                Add "{brandLikeInput}"
                                            </Button>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {POPULAR_BRANDS
                                                .filter(brand => 
                                                    brand.toLowerCase().includes(brandLikeInput.toLowerCase()) &&
                                                    !(prefs.brand_like || []).includes(brand)
                                                )
                                                .map((brand) => (
                                                    <CommandItem
                                                        key={brand}
                                                        value={brand}
                                                        onSelect={() => addBrandLike(brand)}
                                                    >
                                                        {brand}
                                                    </CommandItem>
                                                ))
                                            }
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(prefs.brand_like || []).map((brand) => (
                            <Badge key={brand} variant="secondary" className="flex items-center gap-1">
                                {brand}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => removeBrandLike(brand)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Brands to Avoid */}
                <div className="space-y-3">
                    <Label>Brands to Avoid (optional)</Label>
                    <div className="flex gap-2">
                        <Popover open={brandAvoidOpen} onOpenChange={setBrandAvoidOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex-1 justify-start">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add brand to avoid...
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                    <CommandInput 
                                        placeholder="Search brands..." 
                                        value={brandAvoidInput}
                                        onValueChange={setBrandAvoidInput}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            <Button 
                                                variant="ghost" 
                                                className="w-full"
                                                onClick={() => addBrandAvoid(brandAvoidInput)}
                                                disabled={!brandAvoidInput.trim()}
                                            >
                                                Add "{brandAvoidInput}"
                                            </Button>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {POPULAR_BRANDS
                                                .filter(brand => 
                                                    brand.toLowerCase().includes(brandAvoidInput.toLowerCase()) &&
                                                    !(prefs.brand_avoid || []).includes(brand)
                                                )
                                                .map((brand) => (
                                                    <CommandItem
                                                        key={brand}
                                                        value={brand}
                                                        onSelect={() => addBrandAvoid(brand)}
                                                    >
                                                        {brand}
                                                    </CommandItem>
                                                ))
                                            }
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(prefs.brand_avoid || []).map((brand) => (
                            <Badge key={brand} variant="destructive" className="flex items-center gap-1">
                                {brand}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => removeBrandAvoid(brand)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
