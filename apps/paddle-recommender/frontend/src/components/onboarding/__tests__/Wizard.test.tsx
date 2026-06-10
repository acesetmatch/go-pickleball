import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import OnboardingWizard from '../Wizard';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
  STEP_TITLES: [
    'Skill Level & Context',
    'Play Style & Tendencies',
  ],
  STEP_DESCRIPTIONS: [
    'Tell us about your rating',
    'Describe your playing style',
  ],
}));

const mockNext = vi.fn(() => true);
const mockBack = vi.fn();
const mockGoToStep = vi.fn();
const mockValidateCurrentStep = vi.fn(() => true);
const mockGetStepErrors = vi.fn(() => []);
const mockIsStepComplete = vi.fn(() => false);

const mockUseOnboardingStore = useOnboardingStore as any;
const defaultStore = {
  profile: {},
  video: undefined,
  step: 0,
  next: mockNext,
  back: mockBack,
  goToStep: mockGoToStep,
  validateCurrentStep: mockValidateCurrentStep,
  getStepErrors: mockGetStepErrors,
  isStepComplete: mockIsStepComplete,
};

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue(defaultStore);
    Storage.prototype.getItem = vi.fn(() => null);
    Storage.prototype.setItem = vi.fn();
  });

  it('shows quick start profiles by default', () => {
    render(<OnboardingWizard />);
    expect(screen.getByText('Quick Start')).toBeInTheDocument();
  });

  it('shows wizard form after skipping quick start', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);
    await user.click(screen.getByText('Skip - Answer Manually'));
    expect(screen.getByText('Find Your Perfect Paddle')).toBeInTheDocument();
  });

  it('renders navigation buttons after skipping', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);
    await user.click(screen.getByText('Skip - Answer Manually'));
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeDisabled();
  });

  it('shows progress and step count after skipping', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);
    await user.click(screen.getByText('Skip - Answer Manually'));
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Almost Done')).toBeInTheDocument();
  });

  it('shows paddle preview sidebar after skipping', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);
    await user.click(screen.getByText('Skip - Answer Manually'));
    expect(screen.getByText('Paddle Recommendations')).toBeInTheDocument();
  });
});
