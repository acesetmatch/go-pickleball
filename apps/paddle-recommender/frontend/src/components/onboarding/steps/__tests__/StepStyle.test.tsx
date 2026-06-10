import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepStyle from '../StepStyle';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetStyle = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepStyle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: { style: { styles: [], priority: 'control' } },
      setStyle: mockSetStyle,
    });
  });

  it('renders the title', () => {
    render(<StepStyle />);
    expect(screen.getByText('Play Style & Tendencies')).toBeInTheDocument();
  });

  it('renders style ranking options', () => {
    render(<StepStyle />);
    expect(screen.getByText('Playing Styles')).toBeInTheDocument();
    expect(screen.getByText('Aggressive Finishing')).toBeInTheDocument();
    expect(screen.getByText('All Court')).toBeInTheDocument();
    expect(screen.getByText('Soft Game')).toBeInTheDocument();
  });

  it('renders priority preset buttons', () => {
    render(<StepStyle />);
    expect(screen.getByText("What's most important in your game?")).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Spin')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });

  it('calls setStyle when priority is changed', async () => {
    const user = userEvent.setup();
    render(<StepStyle />);
    await user.click(screen.getByText('Power'));
    expect(mockSetStyle).toHaveBeenCalledWith({ priority: 'power' });
  });

  it('shows priority descriptions', () => {
    render(<StepStyle />);
    expect(screen.getByText('Hit hard, finish points')).toBeInTheDocument();
    expect(screen.getByText('Placement & consistency')).toBeInTheDocument();
  });
});
