import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepPreferences from '../StepPreferences';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetPreferences = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: { prefs: { budget: { min: 50, max: 200 } } },
      setPreferences: mockSetPreferences,
    });
  });

  it('renders the title', () => {
    render(<StepPreferences />);
    expect(screen.getByText('Budget & Brand Preferences')).toBeInTheDocument();
  });

  it('renders budget section', () => {
    render(<StepPreferences />);
    expect(screen.getByText('Budget Range')).toBeInTheDocument();
  });

  it('displays current budget values', () => {
    render(<StepPreferences />);
    const minInput = screen.getByDisplayValue('50');
    const maxInput = screen.getByDisplayValue('200');
    expect(minInput).toBeInTheDocument();
    expect(maxInput).toBeInTheDocument();
  });

  it('renders budget slider', () => {
    const { container } = render(<StepPreferences />);
    const sliders = container.querySelectorAll('[role="slider"]');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it('renders preferred brands section', () => {
    render(<StepPreferences />);
    expect(screen.getByText('Preferred Brands (optional)')).toBeInTheDocument();
  });

  it('renders brands to avoid section', () => {
    render(<StepPreferences />);
    expect(screen.getByText('Brands to Avoid (optional)')).toBeInTheDocument();
  });

  it('calls setPreferences when budget min input changes', async () => {
    const user = userEvent.setup();
    render(<StepPreferences />);
    const minInput = screen.getByDisplayValue('50');
    await user.clear(minInput);
    await user.type(minInput, '100');
    expect(mockSetPreferences).toHaveBeenCalled();
  });

  it('calls setPreferences when budget max input changes', async () => {
    const user = userEvent.setup();
    render(<StepPreferences />);
    const maxInput = screen.getByDisplayValue('200');
    await user.clear(maxInput);
    await user.type(maxInput, '300');
    expect(mockSetPreferences).toHaveBeenCalled();
  });

  it('renders brand badges when brands are selected', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: {
        prefs: {
          budget: { min: 50, max: 200 },
          brand_like: ['Selkirk', 'JOOLA'],
          brand_avoid: ['Franklin']
        }
      },
      setPreferences: mockSetPreferences,
    });
    render(<StepPreferences />);
    expect(screen.getByText('Selkirk')).toBeInTheDocument();
    expect(screen.getByText('JOOLA')).toBeInTheDocument();
    expect(screen.getByText('Franklin')).toBeInTheDocument();
  });
});
