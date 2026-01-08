'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProgressiveSectionProps {
  title: string;
  description?: string;
  accuracyBoost: string; // e.g., "+15%"
  coreQuestions: React.ReactNode;
  detailedQuestions: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function ProgressiveSection({
  title,
  description,
  accuracyBoost,
  coreQuestions,
  detailedQuestions,
  defaultExpanded = false,
  className
}: ProgressiveSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Core Questions - Always Visible */}
      <div className="space-y-4">
        {coreQuestions}
      </div>

      {/* Expand/Collapse Button */}
      <div className="flex items-center justify-center py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Detailed Questions
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {title}
              <Badge variant="secondary" className="ml-2 gap-1">
                <TrendingUp className="w-3 h-3" />
                {accuracyBoost} accuracy
              </Badge>
            </>
          )}
        </Button>
      </div>

      {/* Detailed Questions - Collapsible */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2">
          {description && (
            <p className="text-sm text-muted-foreground italic">
              {description}
            </p>
          )}
          {detailedQuestions}
        </div>
      )}
    </div>
  );
}

// Simpler variant for inline expansion
interface InlineExpansionProps {
  label: string;
  accuracyBoost: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function InlineExpansion({
  label,
  accuracyBoost,
  children,
  defaultExpanded = false
}: InlineExpansionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-muted-foreground hover:text-foreground gap-2"
      >
        <ChevronDown className="w-4 h-4" />
        {label}
        <Badge variant="outline" className="ml-1 gap-1">
          <TrendingUp className="w-3 h-3" />
          {accuracyBoost}
        </Badge>
      </Button>
    );
  }

  return (
    <div className="space-y-3 animate-in slide-in-from-top-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(false)}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronUp className="w-4 h-4 mr-2" />
        Hide {label}
      </Button>
      {children}
    </div>
  );
}
