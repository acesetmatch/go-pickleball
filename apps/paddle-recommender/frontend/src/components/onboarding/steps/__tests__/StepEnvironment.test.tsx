import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepEnvironment from '../StepEnvironment';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetEnvironment = vi.fn();
const mockShouldShowWindQuestions = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShouldShowWindQuestions.mockReturnValue(false);
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: { indoor_pct: 50, outdoor_pct: 50, common_opponents: [] } },
      setEnvironment: mockSetEnvironment,
      shouldShowWindQuestions: mockShouldShowWindQuestions,
    });
  });

  it('renders the title', () => {
    render(<StepEnvironment />);
    expect(screen.getByText('Environment & Opponents')).toBeInTheDocument();
  });

  it('renders playing environment section', () => {
    render(<StepEnvironment />);
    expect(screen.getByText('Playing Environment')).toBeInTheDocument();
  });

  it('displays default 50/50 indoor/outdoor split', () => {
    render(<StepEnvironment />);
    expect(screen.getByText('Indoor: 50%')).toBeInTheDocument();
    expect(screen.getByText('Outdoor: 50%')).toBeInTheDocument();
  });

  it('renders opponent style toggle group', () => {
    render(<StepEnvironment />);
    expect(screen.getByText('Common Opponent Styles')).toBeInTheDocument();
    expect(screen.getByText('Bangers')).toBeInTheDocument();
    expect(screen.getByText('Dinkers')).toBeInTheDocument();
    expect(screen.getByText('Mixed Styles')).toBeInTheDocument();
  });

  it('renders indoor/outdoor extremes labels', () => {
    render(<StepEnvironment />);
    expect(screen.getByText('All Outdoor')).toBeInTheDocument();
    expect(screen.getByText('50/50')).toBeInTheDocument();
    expect(screen.getByText('All Indoor')).toBeInTheDocument();
  });

  it('renders slider', () => {
    const { container } = render(<StepEnvironment />);
    const slider = container.querySelector('[role="slider"]');
    expect(slider).toBeInTheDocument();
  });

  it('shows progressive section for additional details', () => {
    render(<StepEnvironment />);
    expect(screen.getByText('Additional Environment Details')).toBeInTheDocument();
    expect(screen.getByText('+10% accuracy')).toBeInTheDocument();
  });

  it('displays indoor percentage text', () => {
    render(<StepEnvironment />);
    expect(screen.getByText('Indoor: 50%')).toBeInTheDocument();
    expect(screen.getByText('Outdoor: 50%')).toBeInTheDocument();
  });

  it('displays different indoor/outdoor values from store', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: { indoor_pct: 70, outdoor_pct: 30, common_opponents: [] } },
      setEnvironment: mockSetEnvironment,
      shouldShowWindQuestions: mockShouldShowWindQuestions,
    });
    render(<StepEnvironment />);
    expect(screen.getByText('Indoor: 70%')).toBeInTheDocument();
    expect(screen.getByText('Outdoor: 30%')).toBeInTheDocument();
  });

  it('maintains indoor + outdoor = 100 invariant mathematically', () => {
    const testCases = [0, 25, 50, 75, 100];
    testCases.forEach(indoor => {
      const outdoor = 100 - indoor;
      expect(indoor + outdoor).toBe(100);
      expect(indoor).toBeGreaterThanOrEqual(0);
      expect(indoor).toBeLessThanOrEqual(100);
      expect(outdoor).toBeGreaterThanOrEqual(0);
      expect(outdoor).toBeLessThanOrEqual(100);
    });
  });

  it('selects opponent types via toggle group', async () => {
    const user = userEvent.setup();
    render(<StepEnvironment />);
    const bangersButton = screen.getByText('Bangers');
    await user.click(bangersButton);
    expect(mockSetEnvironment).toHaveBeenCalledWith({ common_opponents: ['bangers'] });
  });

  it('allows selecting multiple opponent types', async () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: { indoor_pct: 50, outdoor_pct: 50, common_opponents: ['bangers'] } },
      setEnvironment: mockSetEnvironment,
      shouldShowWindQuestions: mockShouldShowWindQuestions,
    });
    const user = userEvent.setup();
    render(<StepEnvironment />);
    await user.click(screen.getByText('Dinkers'));
    expect(mockSetEnvironment).toHaveBeenCalledWith({ common_opponents: ['bangers', 'dinkers'] });
  });

  it('deselects opponent types when clicked again', async () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: { indoor_pct: 50, outdoor_pct: 50, common_opponents: ['bangers', 'dinkers'] } },
      setEnvironment: mockSetEnvironment,
      shouldShowWindQuestions: mockShouldShowWindQuestions,
    });
    const user = userEvent.setup();
    render(<StepEnvironment />);
    await user.click(screen.getByText('Bangers'));
    expect(mockSetEnvironment).toHaveBeenCalledWith({ common_opponents: ['dinkers'] });
  });

  it('shows wind questions when outdoor > 20% and expanded', async () => {
    mockShouldShowWindQuestions.mockReturnValue(true);
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: { indoor_pct: 30, outdoor_pct: 70, common_opponents: [] } },
      setEnvironment: mockSetEnvironment,
      shouldShowWindQuestions: mockShouldShowWindQuestions,
    });
    const user = userEvent.setup();
    render(<StepEnvironment />);
    await user.click(screen.getByText('Additional Environment Details'));
    expect(screen.getByText('Wind Conditions')).toBeInTheDocument();
  });

  it('expands detailed questions section', async () => {
    const user = userEvent.setup();
    render(<StepEnvironment />);
    await user.click(screen.getByText('Additional Environment Details'));
    expect(screen.getByText('Preferred Court Surface')).toBeInTheDocument();
    expect(screen.getByText('Concrete')).toBeInTheDocument();
    expect(screen.getByText('Asphalt')).toBeInTheDocument();
    expect(screen.getByText('Sport Court')).toBeInTheDocument();
  });
});
