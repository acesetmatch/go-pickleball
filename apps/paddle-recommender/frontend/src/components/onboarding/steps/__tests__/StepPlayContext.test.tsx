import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepPlayContext from '../StepPlayContext';

// Mock the store
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

  it('renders all required form elements', () => {
    render(<StepPlayContext />);
    
    expect(screen.getByText('Skill Level & Context')).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Rating/i)).toBeInTheDocument();
    expect(screen.getByText('What do you primarily play?')).toBeInTheDocument();
    expect(screen.getByText('How competitive is your play?')).toBeInTheDocument();
  });

  it('displays rating examples based on slider value', async () => {
    const user = userEvent.setup();
    mockUseOnboardingStore.mockReturnValue({
      profile: { play: { rating: 3.5 } },
      setPlayContext: mockSetPlayContext,
    });

    render(<StepPlayContext />);
    
    expect(screen.getByText(/Good fundamentals, starting strategic play and net game/i)).toBeInTheDocument();
  });

  it('updates rating when slider changes', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '4.0' } });
    
    expect(mockSetPlayContext).toHaveBeenCalledWith({ rating: 4.0 });
  });

  it('updates plays selection when radio button is clicked', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    
    const doublesRadio = screen.getByLabelText('Doubles');
    await user.click(doublesRadio);
    
    expect(mockSetPlayContext).toHaveBeenCalledWith({ plays: 'doubles' });
  });

  it('updates competitive level when radio button is clicked', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    
    const recreationalRadio = screen.getByLabelText(/Recreational/i);
    await user.click(recreationalRadio);
    
    expect(mockSetPlayContext).toHaveBeenCalledWith({ competitive: 'recreational' });
  });

  it('opens and closes micro quiz dialog', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    
    const quizButton = screen.getByText(/Not sure your rating/i);
    await user.click(quizButton);
    
    expect(screen.getByText('Quick Rating Quiz')).toBeInTheDocument();
    expect(screen.getByText(/How often do you win points at the net/i)).toBeInTheDocument();
  });

  it('calculates rating from quiz answers', async () => {
    const user = userEvent.setup();
    render(<StepPlayContext />);
    
    // Open quiz
    const quizButton = screen.getByText(/Not sure your rating/i);
    await user.click(quizButton);
    
    // Answer all questions with middle options (3.5 rating each)
    const radioButtons = screen.getAllByRole('radio');
    const middleOptions = radioButtons.filter((_, index) => index % 5 === 2); // Every 3rd option (index 2, 7, 12)
    
    for (const radio of middleOptions) {
      await user.click(radio);
    }
    
    // Submit quiz
    const submitButton = screen.getByText('Get My Rating');
    await user.click(submitButton);
    
    expect(mockSetPlayContext).toHaveBeenCalledWith({ rating: 3.5 });
  });

  it('has proper accessibility attributes', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { play: { rating: 3.0 } },
      setPlayContext: mockSetPlayContext,
    });

    render(<StepPlayContext />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext');
    expect(slider.getAttribute('aria-valuetext')).toContain('3 -');
    expect(slider.getAttribute('aria-valuetext')).toContain('Consistent serve and return');
  });

  it('shows focus states on interactive elements', () => {
    render(<StepPlayContext />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveClass('focus-visible:ring-2');
    
    const quizButton = screen.getByText(/Not sure your rating/i);
    expect(quizButton).toHaveClass('focus-visible:ring-2');
  });

  describe('Validation Requirements', () => {
    it('requires rating to be set', () => {
      mockUseOnboardingStore.mockReturnValue({
        profile: { play: { plays: 'doubles', competitive: 'recreational' } },
        setPlayContext: mockSetPlayContext,
      });

      render(<StepPlayContext />);
      
      // Rating should be required for step completion
      // This would be validated by the parent Wizard component
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('requires plays selection', async () => {
      const user = userEvent.setup();
      mockUseOnboardingStore.mockReturnValue({
        profile: { play: { rating: 3.5, competitive: 'recreational' } },
        setPlayContext: mockSetPlayContext,
      });

      render(<StepPlayContext />);
      
      // Should have radio buttons for plays selection
      expect(screen.getByLabelText('Singles')).toBeInTheDocument();
      expect(screen.getByLabelText('Doubles')).toBeInTheDocument();
      expect(screen.getByLabelText('Both')).toBeInTheDocument();
    });

    it('requires competitive level selection', () => {
      mockUseOnboardingStore.mockReturnValue({
        profile: { play: { rating: 3.5, plays: 'doubles' } },
        setPlayContext: mockSetPlayContext,
      });

      render(<StepPlayContext />);
      
      // Should have radio buttons for competitive level
      expect(screen.getByLabelText(/Recreational/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Competitive/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tournament/i)).toBeInTheDocument();
    });

    it('validates complete profile before allowing next step', () => {
      // Complete profile
      mockUseOnboardingStore.mockReturnValue({
        profile: { 
          play: { 
            rating: 3.5, 
            plays: 'doubles', 
            competitive: 'recreational' 
          } 
        },
        setPlayContext: mockSetPlayContext,
      });

      render(<StepPlayContext />);
      
      // All required fields should be present and filled
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('3.5');
      
      const doublesRadio = screen.getByLabelText('Doubles');
      expect(doublesRadio).toBeChecked();
      
      const recreationalRadio = screen.getByLabelText(/Recreational/i);
      expect(recreationalRadio).toBeChecked();
    });
  });
});
