import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepFeelCustomize from '../StepFeelCustomize';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetPreferences = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepFeelCustomize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: { prefs: {} },
      setPreferences: mockSetPreferences,
    });
  });

  it('renders the title', () => {
    render(<StepFeelCustomize />);
    expect(screen.getByText('Paddle Feel & Customization')).toBeInTheDocument();
  });

  it('renders feel preference options', () => {
    render(<StepFeelCustomize />);
    expect(screen.getByText('Paddle Feel Preference')).toBeInTheDocument();
    expect(screen.getByText('More Power')).toBeInTheDocument();
    expect(screen.getByText('More Control')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });

  it('renders customization preference options', () => {
    render(<StepFeelCustomize />);
    expect(screen.getByText('Customization Preference')).toBeInTheDocument();
    expect(screen.getByText(/Yes, I like to customize/)).toBeInTheDocument();
    expect(screen.getByText(/No, I want stock performance/)).toBeInTheDocument();
  });

  it('calls setPreferences when selecting a feel option', async () => {
    const user = userEvent.setup();
    render(<StepFeelCustomize />);
    const radio = screen.getByRole('radio', { name: /More Power/ });
    await user.click(radio);
    expect(mockSetPreferences).toHaveBeenCalledWith({ feel: 'power' });
  });

  it('calls setPreferences when selecting customize option', async () => {
    const user = userEvent.setup();
    render(<StepFeelCustomize />);
    const radio = screen.getByRole('radio', { name: /Yes, I like to customize/ });
    await user.click(radio);
    expect(mockSetPreferences).toHaveBeenCalledWith({ customize: true });
  });

  it('calls setPreferences when selecting stock option', async () => {
    const user = userEvent.setup();
    render(<StepFeelCustomize />);
    const radio = screen.getByRole('radio', { name: /No, I want stock performance/ });
    await user.click(radio);
    expect(mockSetPreferences).toHaveBeenCalledWith({ customize: false });
  });

  it('renders tooltip trigger elements', () => {
    const { container } = render(<StepFeelCustomize />);
    const helpIcons = container.querySelectorAll('svg.lucide');
    expect(helpIcons.length).toBeGreaterThanOrEqual(3);
  });
});
