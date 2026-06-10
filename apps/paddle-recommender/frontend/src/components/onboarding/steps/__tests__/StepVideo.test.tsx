import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepVideo from '../StepVideo';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetVideo = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      video: undefined,
      setVideo: mockSetVideo,
    });
  });

  it('renders the title', () => {
    render(<StepVideo />);
    expect(screen.getByText('Optional Video / Data Capture')).toBeInTheDocument();
  });

  it('renders action buttons when no video is captured', () => {
    render(<StepVideo />);
    expect(screen.getByText('Record')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  it('renders quality requirements section', () => {
    render(<StepVideo />);
    expect(screen.getByText('For Best Results:')).toBeInTheDocument();
    expect(screen.getByText(/8-12 seconds/)).toBeInTheDocument();
  });

  it('renders consent switches', () => {
    render(<StepVideo />);
    expect(screen.getByText('Privacy & Consent')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle video storage consent')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle metrics sharing consent')).toBeInTheDocument();
  });

  it('shows video ready state when video is captured', () => {
    mockUseOnboardingStore.mockReturnValue({
      video: {
        duration_ms: 8000,
        quality: { lighting: 'ok', stability: 'ok', subject_size: 'ok' },
        consent: { store_video: false }
      },
      setVideo: mockSetVideo,
    });
    render(<StepVideo />);
    expect(screen.getByText('Video Ready!')).toBeInTheDocument();
    expect(screen.getByLabelText('Retake video')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete video')).toBeInTheDocument();
  });

  it('shows quality needs improvement when quality is poor', () => {
    mockUseOnboardingStore.mockReturnValue({
      video: {
        duration_ms: 3000,
        quality: { lighting: 'poor', stability: 'ok', subject_size: 'poor' },
        consent: { store_video: false }
      },
      setVideo: mockSetVideo,
    });
    render(<StepVideo />);
    expect(screen.getByText(/Needs improvement/)).toBeInTheDocument();
  });

  it('calls setVideo when delete is clicked', async () => {
    mockUseOnboardingStore.mockReturnValue({
      video: {
        duration_ms: 8000,
        quality: { lighting: 'ok', stability: 'ok', subject_size: 'ok' },
        consent: { store_video: false }
      },
      setVideo: mockSetVideo,
    });
    const user = userEvent.setup();
    render(<StepVideo />);
    await user.click(screen.getByLabelText('Delete video'));
    expect(mockSetVideo).toHaveBeenCalledWith(undefined);
  });

  it('shows optional note', () => {
    render(<StepVideo />);
    expect(screen.getByText(/This step is optional/)).toBeInTheDocument();
  });
});
