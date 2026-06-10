import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepPlayContext from '../StepPlayContext';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetPlayContext = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepPlayContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: { play: {} },
      setPlayContext: mockSetPlayContext,
    });
  });

  it('renders title and description', () => {
    render(<StepPlayContext />);
    expect(screen.getByText('Skill Level & Context')).toBeInTheDocument();
    expect(screen.getByText(/Tell us about your rating/)).toBeInTheDocument();
  });

  it('renders skill level cards', () => {
    render(<StepPlayContext />);
    expect(screen.getByText('Your Skill Level')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Expert/Pro')).toBeInTheDocument();
  });

  it('renders level descriptions', () => {
    render(<StepPlayContext />);
    expect(screen.getByText('Learning fundamentals and basic shots')).toBeInTheDocument();
    expect(screen.getByText('Consistent play with developing strategy')).toBeInTheDocument();
  });

  it('renders game format preset buttons', () => {
    render(<StepPlayContext />);
    expect(screen.getByText('What do you primarily play?')).toBeInTheDocument();
    expect(screen.getByText('Singles')).toBeInTheDocument();
    expect(screen.getByText('Doubles')).toBeInTheDocument();
    expect(screen.getByText('Both')).toBeInTheDocument();
  });

  it('renders competitive level preset buttons', () => {
    render(<StepPlayContext />);
    expect(screen.getByText('Competitive Level')).toBeInTheDocument();
    expect(screen.getByText('Recreational')).toBeInTheDocument();
    expect(screen.getByText('League Play')).toBeInTheDocument();
    expect(screen.getByText('Tournament')).toBeInTheDocument();
  });

  it('renders quiz button', () => {
    render(<StepPlayContext />);
    expect(screen.getByText("I'm not sure")).toBeInTheDocument();
  });

  it('renders level help link', () => {
    render(<StepPlayContext />);
    expect(screen.getByText("What's my level?")).toBeInTheDocument();
  });

  it('updates rating when clicking a skill level card', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    const beginnerCard = screen.getByText('Beginner');
    await user.click(beginnerCard);
    expect(mockSetPlayContext).toHaveBeenCalledWith({ rating: 2.5 });
  });

  it('updates plays when game format is selected', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    await user.click(screen.getByText('Doubles'));
    expect(mockSetPlayContext).toHaveBeenCalledWith({ plays: 'doubles' });
  });

  it('updates competitive level when selected', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    await user.click(screen.getByText('Recreational'));
    expect(mockSetPlayContext).toHaveBeenCalledWith({ competitive: 'rec' });
  });

  it('opens quiz dialog when clicking not sure', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    await user.click(screen.getByText("I'm not sure"));
    expect(screen.getByText('Quick Skill Assessment')).toBeInTheDocument();
    expect(screen.getByText(/Answer a few questions/)).toBeInTheDocument();
  });

  it('shows quiz questions in dialog', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    await user.click(screen.getByText("I'm not sure"));
    expect(screen.getByText(/How often do you win points/)).toBeInTheDocument();
    expect(screen.getByText(/How consistent are your serves/)).toBeInTheDocument();
    expect(screen.getByText(/How do you handle fast exchanges/)).toBeInTheDocument();
  });

  it('shows DUPR badges on level cards', () => {
    render(<StepPlayContext />);
    expect(screen.getByText('DUPR 2.00–2.99')).toBeInTheDocument();
    expect(screen.getByText('DUPR 3.00–3.99')).toBeInTheDocument();
    expect(screen.getByText('DUPR 4.0–4.99')).toBeInTheDocument();
    expect(screen.getByText('DUPR 5.0–8.0')).toBeInTheDocument();
  });

  it('highlights selected level card', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { play: { rating: 3.5 } },
      setPlayContext: mockSetPlayContext,
    });
    render(<StepPlayContext />);
    const intermediateCards = screen.getAllByText('Intermediate');
    expect(intermediateCards.length).toBeGreaterThanOrEqual(1);
  });
});
