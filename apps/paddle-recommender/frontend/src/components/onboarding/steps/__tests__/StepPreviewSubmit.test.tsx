import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepPreviewSubmit from '../StepPreviewSubmit';

const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockReset = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

const completeProfile = {
  play: { rating: 3.5, plays: 'doubles', competitive: 'recreational' },
  style: { styles: ['all_court', 'soft_game'], priority: 'control' },
  physical: { arm_sensitivity: false, weight_tolerance: 'medium' },
  setup: { current_paddle_id: 'selkirk-amped', pain_points: ['arm_fatigue'] },
  env: { indoor_pct: 60, outdoor_pct: 40, common_opponents: ['bangers'] },
  prefs: { budget: { min: 50, max: 200 }, brand_like: ['Selkirk'] },
  aspirations: { primary_goal: 'consistency', target_rating: 4.0 },
};

describe('StepPreviewSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: completeProfile,
      video: undefined,
      reset: mockReset,
    });
  });

  it('renders the title', () => {
    render(<StepPreviewSubmit />);
    expect(screen.getByText('Preview & Submit')).toBeInTheDocument();
  });

  it('renders all section cards', () => {
    render(<StepPreviewSubmit />);
    expect(screen.getByText('1. Skill Level & Context')).toBeInTheDocument();
    expect(screen.getByText('2. Play Style')).toBeInTheDocument();
    expect(screen.getByText('3. Physical Factors')).toBeInTheDocument();
    expect(screen.getByText('4. Current Setup & Pain Points')).toBeInTheDocument();
    expect(screen.getByText('5. Environment')).toBeInTheDocument();
    expect(screen.getByText('6. Budget & Preferences')).toBeInTheDocument();
    expect(screen.getByText('7. Goals')).toBeInTheDocument();
  });

  it('displays profile data in section cards', () => {
    render(<StepPreviewSubmit />);
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('doubles')).toBeInTheDocument();
    expect(screen.getByText('all_court')).toBeInTheDocument();
    expect(screen.getByText('arm_fatigue')).toBeInTheDocument();
  });

  it('shows confidence badge', () => {
    render(<StepPreviewSubmit />);
    expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<StepPreviewSubmit />);
    expect(screen.getByText('Get My Paddle Recommendations')).toBeInTheDocument();
  });

  it('renders start over text', () => {
    render(<StepPreviewSubmit />);
    expect(screen.getByText(/We'll analyze your preferences/)).toBeInTheDocument();
  });

  it('shows high confidence with video and full profile', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: completeProfile,
      video: { duration_ms: 5000, quality: { lighting: 'ok', stability: 'ok', subject_size: 'ok' }, consent: { store_video: false } },
      reset: mockReset,
    });
    render(<StepPreviewSubmit />);
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
  });

  it('shows video analysis section when video is present', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: completeProfile,
      video: { duration_ms: 5000, quality: { lighting: 'ok', stability: 'ok', subject_size: 'ok' }, consent: { store_video: false } },
      reset: mockReset,
    });
    render(<StepPreviewSubmit />);
    expect(screen.getByText('Video Analysis')).toBeInTheDocument();
  });

  it('displays error toast on submission failure', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    render(<StepPreviewSubmit />);
    const submitButton = screen.getByText('Get My Paddle Recommendations');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText('Submission Failed')).not.toBeInTheDocument();
    });
  });
});
