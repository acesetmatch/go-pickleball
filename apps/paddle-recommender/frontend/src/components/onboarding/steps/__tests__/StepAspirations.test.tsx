import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepAspirations from '../StepAspirations';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetAspirations = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepAspirations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: { aspirations: {} },
      setAspirations: mockSetAspirations,
    });
  });

  it('renders the title', () => {
    render(<StepAspirations />);
    expect(screen.getByText('Aspirations / Goals')).toBeInTheDocument();
  });

  it('renders primary goal section', () => {
    render(<StepAspirations />);
    expect(screen.getByText('Primary Goal')).toBeInTheDocument();
  });

  it('renders target rating input', () => {
    render(<StepAspirations />);
    const input = screen.getByPlaceholderText(/e.g., 4.0/);
    expect(input).toBeInTheDocument();
  });

  it('calls setAspirations with target rating', async () => {
    const user = userEvent.setup();
    render(<StepAspirations />);
    const input = screen.getByPlaceholderText(/e.g., 4.0/);
    await user.type(input, '4.0');
    expect(mockSetAspirations).toHaveBeenCalled();
  });

  it('shows selected goal description when goal is set', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { aspirations: { primary_goal: 'power' } },
      setAspirations: mockSetAspirations,
    });
    render(<StepAspirations />);
    expect(screen.getAllByText(/Hit harder shots/).length).toBeGreaterThanOrEqual(1);
  });
});
