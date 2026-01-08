'use client';

import React, { useEffect } from 'react';
import { useOnboardingStore, STEP_TITLES, STEP_DESCRIPTIONS } from '@/store/onboarding';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import all step components
import QuickStartProfiles from './QuickStartProfiles';
import { PaddlePreview } from './shared/PaddlePreview';
import StepPlayContext from './steps/StepPlayContext';
import StepStyle from './steps/StepStyle';
import StepPhysical from './steps/StepPhysical';
import StepSetupPain from './steps/StepSetupPain';
import StepFeelCustomize from './steps/StepFeelCustomize';
import StepEnvironment from './steps/StepEnvironment';
import StepPreferences from './steps/StepPreferences';
import StepAspirations from './steps/StepAspirations';
import StepVideo from './steps/StepVideo';
import StepPreviewSubmit from './steps/StepPreviewSubmit';

const STEPS = [
  StepPlayContext,
  StepStyle,
  StepPhysical,
  StepFeelCustomize,
  StepSetupPain,
  StepEnvironment,
  StepPreferences,
  StepAspirations,
  // StepVideo, // Disabled for now - future release
  StepPreviewSubmit
];

const STORAGE_KEY = 'pickleball-onboarding-profile';

export default function OnboardingWizard() {
  const {
    profile,
    video,
    step,
    next,
    back,
    goToStep,
    validateCurrentStep,
    getStepErrors,
    isStepComplete
  } = useOnboardingStore();

  const [showQuickStart, setShowQuickStart] = React.useState(true);
  const [hasUsedQuickStart, setHasUsedQuickStart] = React.useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { profile: savedProfile, video: savedVideo, step: savedStep, hasUsedQuickStart: savedQuickStart } = JSON.parse(saved);
        // You would need to add a method to restore state in the store
        // For now, we'll just note this needs implementation
        console.log('Loaded saved profile:', savedProfile);
        if (savedStep > 0 || savedQuickStart) {
          setShowQuickStart(false);
          setHasUsedQuickStart(savedQuickStart || false);
        }
      } catch (error) {
        console.error('Failed to load saved profile:', error);
      }
    }
  }, []);

  // Save to localStorage whenever profile changes
  useEffect(() => {
    const dataToSave = { profile, video, step, hasUsedQuickStart };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [profile, video, step, hasUsedQuickStart]);

  const handleQuickStartSelect = (profileId: string) => {
    setHasUsedQuickStart(true);
    setShowQuickStart(false);
    console.log('Selected quick start profile:', profileId);
  };

  const handleQuickStartSkip = () => {
    setShowQuickStart(false);
  };

  const CurrentStepComponent = STEPS[step];
  const isValid = validateCurrentStep();
  const errors = getStepErrors();
  const progress = ((step + 1) / STEPS.length) * 100;
  
  // Track if user has attempted to proceed (to show validation errors)
  const [hasAttemptedNext, setHasAttemptedNext] = React.useState(false);
  
  // Reset hasAttemptedNext when step changes
  React.useEffect(() => {
    setHasAttemptedNext(false);
  }, [step]);

  const canGoNext = step < STEPS.length - 1 && isValid;
  const canGoBack = step > 0;
  const isLastStep = step === STEPS.length - 1;

  const handleNext = () => {
    setHasAttemptedNext(true);
    if (canGoNext) {
      next();
      setHasAttemptedNext(false); // Reset for next step
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      back();
    }
  };

  // Show QuickStart if not yet completed
  if (showQuickStart) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <QuickStartProfiles
            onSelect={handleQuickStartSelect}
            onSkip={handleQuickStartSkip}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Find Your Perfect Paddle</h1>
            <div className="text-sm text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Getting Started</span>
              <span>Almost Done</span>
            </div>
          </div>
        </div>

        {/* Step Navigation Breadcrumbs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {STEP_TITLES.map((title, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  index === step
                    ? 'bg-primary text-primary-foreground'
                    : index < step
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : isStepComplete(index)
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                disabled={index > step && !isStepComplete(index)}
              >
                {title}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout: Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Step Title & Description */}
            <div className="text-center lg:text-left">
              <h2 className="text-xl font-semibold mb-2">{STEP_TITLES[step]}</h2>
              <p className="text-muted-foreground">{STEP_DESCRIPTIONS[step]}</p>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              <CurrentStepComponent />
            </div>

            {/* Validation Errors - only show if user has attempted to proceed */}
            {hasAttemptedNext && errors.length > 0 && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h3 className="font-medium text-destructive mb-2">Please fix the following:</h3>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={!canGoBack}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {!isLastStep ? (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Complete the form above to finish
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center lg:text-left text-sm text-muted-foreground">
              <p>
                Your progress is automatically saved. You can come back anytime to complete your profile.
              </p>
            </div>
          </div>

          {/* Paddle Preview - Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PaddlePreview maxPaddles={5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
