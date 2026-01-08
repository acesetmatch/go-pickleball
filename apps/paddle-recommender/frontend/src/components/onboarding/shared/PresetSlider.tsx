'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Preset {
  label: string;
  value: number;
  description?: string;
}

interface PresetSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  presets: Preset[];
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

export function PresetSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  presets,
  showValue = true,
  formatValue,
  className
}: PresetSliderProps) {
  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {showValue && (
            <span className="text-sm font-medium text-muted-foreground">
              {displayValue}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant={value === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(preset.value)}
            className="flex-1 min-w-[100px]"
          >
            <div className="text-center">
              <div className="font-medium">{preset.label}</div>
              {preset.description && (
                <div className="text-xs opacity-80">{preset.description}</div>
              )}
            </div>
          </Button>
        ))}
      </div>

      {/* Slider for fine-tuning */}
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

// Trade-off slider variant (for -100 to 100 with center at 0)
interface TradeoffSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  centerLabel?: string;
  className?: string;
}

export function TradeoffSlider({
  label,
  description,
  value,
  onChange,
  leftLabel,
  rightLabel,
  centerLabel = "Balanced",
  className
}: TradeoffSliderProps) {
  const presets: Preset[] = [
    { label: leftLabel, value: -75, description: "Strong preference" },
    { label: centerLabel, value: 0, description: "Equal priority" },
    { label: rightLabel, value: 75, description: "Strong preference" }
  ];

  const getPositionLabel = () => {
    if (value === 0) return centerLabel;
    if (value < -50) return `Much more ${leftLabel.toLowerCase()}`;
    if (value < 0) return `More ${leftLabel.toLowerCase()}`;
    if (value > 50) return `Much more ${rightLabel.toLowerCase()}`;
    return `More ${rightLabel.toLowerCase()}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <span className="text-sm font-medium text-muted-foreground">
            {getPositionLabel()}
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant={value === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(preset.value)}
          >
            <div className="text-center text-xs">
              <div className="font-medium">{preset.label}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Slider with visual center point */}
      <div className="px-2">
        <div className="relative">
          <Slider
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            min={-100}
            max={100}
            step={5}
            className="w-full"
          />
          {/* Center indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-border pointer-events-none" />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{leftLabel}</span>
          <span className="text-center">{centerLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}

// Simple preset buttons without slider
interface PresetButtonsProps {
  label: string;
  description?: string;
  value: string | number;
  onChange: (value: any) => void;
  options: Array<{
    value: any;
    label: string;
    description?: string;
  }>;
  className?: string;
}

export function PresetButtons({
  label,
  description,
  value,
  onChange,
  options,
  className
}: PresetButtonsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((option) => (
          <Button
            key={String(option.value)}
            type="button"
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value)}
            className="h-auto py-3"
          >
            <div className="text-center">
              <div className="font-medium">{option.label}</div>
              {option.description && (
                <div className="text-xs opacity-80 mt-0.5">
                  {option.description}
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
