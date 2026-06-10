import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepSetupPain from '../StepSetupPain';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetSetupPain = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepSetupPain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: { setup: {} },
      setSetupPain: mockSetSetupPain,
    });
  });

  it('renders title and card description', () => {
    render(<StepSetupPain />);
    expect(screen.getByText('Current Setup & Pain Points')).toBeInTheDocument();
    expect(screen.getByText(/What paddle do you use now/)).toBeInTheDocument();
  });

  it('renders paddle selector', () => {
    render(<StepSetupPain />);
    expect(screen.getByText('Current Paddle (optional)')).toBeInTheDocument();
    expect(screen.getByText('Search for your paddle...')).toBeInTheDocument();
  });

  it('renders pain point checkboxes', () => {
    render(<StepSetupPain />);
    expect(screen.getByText('What frustrates you most?')).toBeInTheDocument();
    expect(screen.getByText('Resets Fall Short')).toBeInTheDocument();
    expect(screen.getByText('Pop-ups')).toBeInTheDocument();
  });

  it('shows pain point counter', () => {
    render(<StepSetupPain />);
    expect(screen.getByText('Selected: 0/2 pain points')).toBeInTheDocument();
  });

  it('renders notes textarea', () => {
    render(<StepSetupPain />);
    expect(screen.getByText('Additional Notes (optional)')).toBeInTheDocument();
  });

  it('opens paddle dropdown and selects a paddle', async () => {
    const user = userEvent.setup();
    render(<StepSetupPain />);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    const paddleOption = screen.getByText('Selkirk Amped S2');
    await user.click(paddleOption);
    expect(mockSetSetupPain).toHaveBeenCalledWith({ current_paddle_id: 'selkirk-amped-s2' });
  });

  it('toggles a pain point checkbox', async () => {
    const user = userEvent.setup();
    render(<StepSetupPain />);
    await user.click(screen.getByLabelText('Resets Fall Short'));
    expect(mockSetSetupPain).toHaveBeenCalledWith({ pain_points: ['resets_short'] });
  });

  it('disables checkboxes when 2 pain points selected', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { setup: { pain_points: ['resets_short', 'popups'] } },
      setSetupPain: mockSetSetupPain,
    });
    render(<StepSetupPain />);
    const checkboxes = screen.getAllByRole('checkbox');
    const enabled = checkboxes.filter(cb => !cb.hasAttribute('disabled'));
    expect(enabled.length).toBeLessThanOrEqual(2);
  });

  it('shows correct pain point count', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { setup: { pain_points: ['resets_short'] } },
      setSetupPain: mockSetSetupPain,
    });
    render(<StepSetupPain />);
    expect(screen.getByText('Selected: 1/2 pain points')).toBeInTheDocument();
  });

  it('updates notes field', () => {
    render(<StepSetupPain />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Paddle feels too heavy' } });
    expect(mockSetSetupPain).toHaveBeenCalledWith({ notes: 'Paddle feels too heavy' });
  });
});
