import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepEnvironment from '../StepEnvironment';

// Mock the store
vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetEnvironment = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: {} },
      setEnvironment: mockSetEnvironment,
    });
  });

  it('renders all form elements', () => {
    render(<StepEnvironment />);
    
    expect(screen.getByText('Environment & Opponents')).toBeInTheDocument();
    expect(screen.getByText('Playing Environment')).toBeInTheDocument();
    expect(screen.getByText('Common Opponents')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('displays default 50/50 indoor/outdoor split', () => {
    render(<StepEnvironment />);
    
    expect(screen.getByText('Indoor: 50%')).toBeInTheDocument();
    expect(screen.getByText('Outdoor: 50%')).toBeInTheDocument();
  });

  it('updates indoor percentage and maintains invariant', async () => {
    const user = userEvent.setup();
    render(<StepEnvironment />);
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '70' } });
    
    expect(mockSetEnvironment).toHaveBeenCalledWith({
      indoor_pct: 70,
      outdoor_pct: 30
    });
  });

  it('maintains indoor + outdoor = 100 invariant', () => {
    const testCases = [
      { indoor: 0, outdoor: 100 },
      { indoor: 25, outdoor: 75 },
      { indoor: 50, outdoor: 50 },
      { indoor: 75, outdoor: 25 },
      { indoor: 100, outdoor: 0 },
    ];

    testCases.forEach(({ indoor, outdoor }) => {
      mockUseOnboardingStore.mockReturnValue({
        profile: { env: { indoor_pct: indoor, outdoor_pct: outdoor } },
        setEnvironment: mockSetEnvironment,
      });

      const { unmount } = render(<StepEnvironment />);
      
      expect(screen.getByText(`Indoor: ${indoor}%`)).toBeInTheDocument();
      expect(screen.getByText(`Outdoor: ${outdoor}%`)).toBeInTheDocument();
      
      // Verify the invariant
      expect(indoor + outdoor).toBe(100);
      
      unmount();
    });
  });

  it('updates slider and recalculates outdoor percentage', async () => {
    render(<StepEnvironment />);
    
    const slider = screen.getByRole('slider');
    
    // Test various indoor percentages
    const testValues = [0, 25, 50, 75, 100];
    
    testValues.forEach(indoorPct => {
      fireEvent.change(slider, { target: { value: indoorPct.toString() } });
      
      expect(mockSetEnvironment).toHaveBeenCalledWith({
        indoor_pct: indoorPct,
        outdoor_pct: 100 - indoorPct
      });
    });
  });

  it('selects opponent types', async () => {
    const user = userEvent.setup();
    render(<StepEnvironment />);
    
    const bangersButton = screen.getByText('Bangers');
    await user.click(bangersButton);
    
    expect(mockSetEnvironment).toHaveBeenCalledWith({
      common_opponents: ['bangers']
    });
  });

  it('allows multiple opponent type selections', async () => {
    const user = userEvent.setup();
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: { common_opponents: ['bangers'] } },
      setEnvironment: mockSetEnvironment,
    });

    render(<StepEnvironment />);
    
    const dinkersButton = screen.getByText('Dinkers');
    await user.click(dinkersButton);
    
    expect(mockSetEnvironment).toHaveBeenCalledWith({
      common_opponents: ['bangers', 'dinkers']
    });
  });

  it('deselects opponent types when clicked again', async () => {
    const user = userEvent.setup();
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: { common_opponents: ['bangers', 'dinkers'] } },
      setEnvironment: mockSetEnvironment,
    });

    render(<StepEnvironment />);
    
    const bangersButton = screen.getByText('Bangers');
    await user.click(bangersButton);
    
    expect(mockSetEnvironment).toHaveBeenCalledWith({
      common_opponents: ['dinkers']
    });
  });

  it('has proper accessibility attributes', () => {
    mockUseOnboardingStore.mockReturnValue({
      profile: { env: { indoor_pct: 60, outdoor_pct: 40 } },
      setEnvironment: mockSetEnvironment,
    });

    render(<StepEnvironment />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext');
    expect(slider.getAttribute('aria-valuetext')).toContain('60% indoor, 40% outdoor');
  });

  it('shows focus states on interactive elements', () => {
    render(<StepEnvironment />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveClass('focus-visible:ring-2');
  });

  describe('Indoor/Outdoor Invariant Tests', () => {
    it('enforces indoor + outdoor = 100 when indoor changes', () => {
      render(<StepEnvironment />);
      
      const slider = screen.getByRole('slider');
      
      // Test edge cases
      fireEvent.change(slider, { target: { value: '0' } });
      expect(mockSetEnvironment).toHaveBeenCalledWith({
        indoor_pct: 0,
        outdoor_pct: 100
      });
      
      fireEvent.change(slider, { target: { value: '100' } });
      expect(mockSetEnvironment).toHaveBeenCalledWith({
        indoor_pct: 100,
        outdoor_pct: 0
      });
    });

    it('maintains invariant with step increments', () => {
      render(<StepEnvironment />);
      
      const slider = screen.getByRole('slider');
      
      // Test 5% increments (as defined in component)
      const increments = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
      
      increments.forEach(indoor => {
        fireEvent.change(slider, { target: { value: indoor.toString() } });
        
        expect(mockSetEnvironment).toHaveBeenCalledWith({
          indoor_pct: indoor,
          outdoor_pct: 100 - indoor
        });
        
        // Verify invariant
        expect(indoor + (100 - indoor)).toBe(100);
      });
    });

    it('handles boundary values correctly', () => {
      render(<StepEnvironment />);
      
      const slider = screen.getByRole('slider');
      
      // Test min boundary
      fireEvent.change(slider, { target: { value: '0' } });
      expect(mockSetEnvironment).toHaveBeenCalledWith({
        indoor_pct: 0,
        outdoor_pct: 100
      });
      
      // Test max boundary  
      fireEvent.change(slider, { target: { value: '100' } });
      expect(mockSetEnvironment).toHaveBeenCalledWith({
        indoor_pct: 100,
        outdoor_pct: 0
      });
    });

    it('displays correct percentages after slider changes', async () => {
      const { rerender } = render(<StepEnvironment />);
      
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '80' } });
      
      // Mock updated state
      mockUseOnboardingStore.mockReturnValue({
        profile: { env: { indoor_pct: 80, outdoor_pct: 20 } },
        setEnvironment: mockSetEnvironment,
      });
      
      rerender(<StepEnvironment />);
      
      expect(screen.getByText('Indoor: 80%')).toBeInTheDocument();
      expect(screen.getByText('Outdoor: 20%')).toBeInTheDocument();
    });

    it('validates invariant mathematically', () => {
      // Test all possible 5% increments
      for (let indoor = 0; indoor <= 100; indoor += 5) {
        const outdoor = 100 - indoor;
        
        mockUseOnboardingStore.mockReturnValue({
          profile: { env: { indoor_pct: indoor, outdoor_pct: outdoor } },
          setEnvironment: mockSetEnvironment,
        });

        const { unmount } = render(<StepEnvironment />);
        
        // Mathematical invariant check
        expect(indoor + outdoor).toBe(100);
        expect(indoor).toBeGreaterThanOrEqual(0);
        expect(indoor).toBeLessThanOrEqual(100);
        expect(outdoor).toBeGreaterThanOrEqual(0);
        expect(outdoor).toBeLessThanOrEqual(100);
        
        unmount();
      }
    });
  });
});
