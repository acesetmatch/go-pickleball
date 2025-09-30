import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepSetupPain from '../StepSetupPain';

// Mock the store
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

  it('renders all form elements', () => {
    render(<StepSetupPain />);
    
    expect(screen.getByText('Current Setup & Pain Points')).toBeInTheDocument();
    expect(screen.getByText('Current Paddle')).toBeInTheDocument();
    expect(screen.getByText('Pain Points (select up to 2)')).toBeInTheDocument();
    expect(screen.getByLabelText(/Additional notes/i)).toBeInTheDocument();
  });

  it('opens paddle selection dropdown', async () => {
    const user = userEvent.setup();
    render(<StepSetupPain />);
    
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    
    expect(screen.getByText('Selkirk AMPED Epic')).toBeInTheDocument();
    expect(screen.getByText('JOOLA Ben Johns Hyperion')).toBeInTheDocument();
  });

  it('selects a paddle from dropdown', async () => {
    const user = userEvent.setup();
    render(<StepSetupPain />);
    
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);
    
    const paddle = screen.getByText('Selkirk AMPED Epic');
    await user.click(paddle);
    
    expect(mockSetSetupPain).toHaveBeenCalledWith({ 
      current_paddle_id: 'selkirk-amped-epic' 
    });
  });

  it('allows selecting up to 2 pain points', async () => {
    const user = userEvent.setup();
    render(<StepSetupPain />);
    
    // Select first pain point
    const armFatigueCheckbox = screen.getByLabelText('Arm fatigue');
    await user.click(armFatigueCheckbox);
    
    expect(mockSetSetupPain).toHaveBeenCalledWith({ 
      pain_points: ['arm_fatigue'] 
    });
    
    // Select second pain point
    const lackPowerCheckbox = screen.getByLabelText('Lack of power');
    await user.click(lackPowerCheckbox);
    
    expect(mockSetSetupPain).toHaveBeenCalledWith({ 
      pain_points: ['arm_fatigue', 'lack_power'] 
    });
  });

  it('prevents selecting more than 2 pain points', async () => {
    const user = userEvent.setup();
    
    // Mock store with 2 pain points already selected
    mockUseOnboardingStore.mockReturnValue({
      profile: { 
        setup: { 
          pain_points: ['arm_fatigue', 'lack_power'] 
        } 
      },
      setSetupPain: mockSetSetupPain,
    });

    render(<StepSetupPain />);
    
    // Try to select a third pain point
    const lackControlCheckbox = screen.getByLabelText('Lack of control');
    expect(lackControlCheckbox).toBeDisabled();
    
    // Verify the disabled checkbox cannot be clicked
    await user.click(lackControlCheckbox);
    expect(mockSetSetupPain).not.toHaveBeenCalled();
  });

  it('allows deselecting pain points', async () => {
    const user = userEvent.setup();
    
    // Mock store with pain points selected
    mockUseOnboardingStore.mockReturnValue({
      profile: { 
        setup: { 
          pain_points: ['arm_fatigue', 'lack_power'] 
        } 
      },
      setSetupPain: mockSetSetupPain,
    });

    render(<StepSetupPain />);
    
    // Deselect first pain point
    const armFatigueCheckbox = screen.getByLabelText('Arm fatigue');
    await user.click(armFatigueCheckbox);
    
    expect(mockSetSetupPain).toHaveBeenCalledWith({ 
      pain_points: ['lack_power'] 
    });
  });

  it('shows pain point counter', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { 
        setup: { 
          pain_points: ['arm_fatigue'] 
        } 
      },
      setSetupPain: mockSetSetupPain,
    });

    render(<StepSetupPain />);
    
    expect(screen.getByText('Selected: 1/2 pain points')).toBeInTheDocument();
  });

  it('updates notes field', async () => {
    const user = userEvent.setup();
    render(<StepSetupPain />);
    
    const notesTextarea = screen.getByLabelText(/Additional notes/i);
    await user.type(notesTextarea, 'My paddle feels too heavy');
    
    expect(mockSetSetupPain).toHaveBeenCalledWith({ 
      notes: 'My paddle feels too heavy' 
    });
  });

  it('shows validation helper text', () => {
    render(<StepSetupPain />);
    
    expect(screen.getByText(/Help us understand what's not working/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<StepSetupPain />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAttribute('id');
      const label = screen.getByLabelText(checkbox.getAttribute('aria-labelledby') || '');
      expect(label).toBeInTheDocument();
    });
  });

  describe('Pain Points Cap Validation', () => {
    it('enforces maximum of 2 pain points', async () => {
      const user = userEvent.setup();
      render(<StepSetupPain />);
      
      // Select first pain point
      await user.click(screen.getByLabelText('Arm fatigue'));
      expect(mockSetSetupPain).toHaveBeenCalledWith({ pain_points: ['arm_fatigue'] });
      
      // Select second pain point
      await user.click(screen.getByLabelText('Lack of power'));
      expect(mockSetSetupPain).toHaveBeenCalledWith({ pain_points: ['arm_fatigue', 'lack_power'] });
      
      // Mock the updated state
      mockUseOnboardingStore.mockReturnValue({
        profile: { setup: { pain_points: ['arm_fatigue', 'lack_power'] } },
        setSetupPain: mockSetSetupPain,
      });
      
      // Re-render with updated state
      render(<StepSetupPain />);
      
      // Verify remaining checkboxes are disabled
      const remainingCheckboxes = [
        'Lack of control',
        'Poor feel',
        'Handle issues',
        'Durability concerns'
      ];
      
      remainingCheckboxes.forEach(label => {
        const checkbox = screen.getByLabelText(label);
        expect(checkbox).toBeDisabled();
      });
    });

    it('re-enables checkboxes when pain points are deselected', async () => {
      const user = userEvent.setup();
      
      // Start with 2 pain points selected
      mockUseOnboardingStore.mockReturnValue({
        profile: { setup: { pain_points: ['arm_fatigue', 'lack_power'] } },
        setSetupPain: mockSetSetupPain,
      });

      render(<StepSetupPain />);
      
      // Deselect one pain point
      await user.click(screen.getByLabelText('Arm fatigue'));
      
      // Mock the updated state with only 1 pain point
      mockUseOnboardingStore.mockReturnValue({
        profile: { setup: { pain_points: ['lack_power'] } },
        setSetupPain: mockSetSetupPain,
      });
      
      // Re-render
      render(<StepSetupPain />);
      
      // Verify other checkboxes are now enabled
      const lackControlCheckbox = screen.getByLabelText('Lack of control');
      expect(lackControlCheckbox).not.toBeDisabled();
    });

    it('shows correct counter with pain point selection', () => {
      const testCases = [
        { painPoints: [], expected: '0/2' },
        { painPoints: ['arm_fatigue'], expected: '1/2' },
        { painPoints: ['arm_fatigue', 'lack_power'], expected: '2/2' },
      ];

      testCases.forEach(({ painPoints, expected }) => {
        mockUseOnboardingStore.mockReturnValue({
          profile: { setup: { pain_points: painPoints } },
          setSetupPain: mockSetSetupPain,
        });

        const { unmount } = render(<StepSetupPain />);
        expect(screen.getByText(`Selected: ${expected} pain points`)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
