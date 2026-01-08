'use client';

import React, { useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RankingOption {
  id: string;
  label: string;
  description?: string;
}

interface RankingInputProps {
  label: string;
  description?: string;
  options: RankingOption[];
  value: string[]; // Array of IDs in ranked order
  onChange: (rankedIds: string[]) => void;
  minSelections?: number;
  maxSelections?: number;
  className?: string;
}

export function RankingInput({
  label,
  description,
  options,
  value,
  onChange,
  minSelections = 1,
  maxSelections = options.length,
  className
}: RankingInputProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Get selected options in ranked order
  const selectedOptions = value
    .map(id => options.find(opt => opt.id === id))
    .filter(Boolean) as RankingOption[];

  // Get unselected options
  const unselectedOptions = options.filter(opt => !value.includes(opt.id));

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newRanking = [...value];
    const [movedItem] = newRanking.splice(draggedIndex, 1);
    newRanking.splice(targetIndex, 0, movedItem);

    onChange(newRanking);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddOption = (optionId: string) => {
    if (value.length < maxSelections) {
      onChange([...value, optionId]);
    }
  };

  const handleRemoveOption = (optionId: string) => {
    if (value.length > minSelections) {
      onChange(value.filter(id => id !== optionId));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newRanking = [...value];
    [newRanking[index - 1], newRanking[index]] = [newRanking[index], newRanking[index - 1]];
    onChange(newRanking);
  };

  const handleMoveDown = (index: number) => {
    if (index === value.length - 1) return;
    const newRanking = [...value];
    [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
    onChange(newRanking);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Ranked Items */}
      {selectedOptions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Your Rankings (Drag to reorder)
          </div>
          <div className="space-y-2">
            {selectedOptions.map((option, index) => (
              <div
                key={option.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border bg-card cursor-move transition-all',
                  draggedIndex === index && 'opacity-50',
                  dragOverIndex === index && draggedIndex !== index && 'border-primary bg-accent',
                  'hover:bg-accent/50'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Badge variant="secondary" className="flex-shrink-0">
                    #{index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile-friendly buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="h-8 w-8 p-0 md:hidden"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === selectedOptions.length - 1}
                    className="h-8 w-8 p-0 md:hidden"
                  >
                    ↓
                  </Button>
                  {value.length > minSelections && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(option.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Options */}
      {unselectedOptions.length > 0 && value.length < maxSelections && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Available Options (Click to add)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {unselectedOptions.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="outline"
                onClick={() => handleAddOption(option.id)}
                className="h-auto py-3 justify-start text-left"
              >
                <div className="w-full">
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Selection count */}
      <div className="text-xs text-muted-foreground">
        {value.length} of {maxSelections} selected
        {minSelections > 0 && ` (minimum: ${minSelections})`}
      </div>
    </div>
  );
}

// Simpler variant for simple text ranking (no descriptions)
interface SimpleRankingInputProps {
  label: string;
  description?: string;
  items: string[];
  value: string[];
  onChange: (rankedItems: string[]) => void;
  className?: string;
}

export function SimpleRankingInput({
  label,
  description,
  items,
  value,
  onChange,
  className
}: SimpleRankingInputProps) {
  const options: RankingOption[] = items.map(item => ({
    id: item,
    label: item
  }));

  return (
    <RankingInput
      label={label}
      description={description}
      options={options}
      value={value}
      onChange={onChange}
      minSelections={0}
      maxSelections={items.length}
      className={className}
    />
  );
}
