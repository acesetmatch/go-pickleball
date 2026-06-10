import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import StepPhysical from '../StepPhysical';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetPhysical = vi.fn();
const mockShouldShowArmSensitivityDetails = vi.fn();
const mockUseOnboardingStore = useOnboardingStore as any;

describe('StepPhysical', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShouldShowArmSensitivityDetails.mockReturnValue(false);
    mockUseOnboardingStore.mockReturnValue({
      profile: { physical: { arm_sensitivity: false, weight_tolerance: 'medium' } },
      setPhysical: mockSetPhysical,
      shouldShowArmSensitivityDetails: mockShouldShowArmSensitivityDetails,
    });
  });

  it('renders the title', () => {
    render(<StepPhysical />);
    expect(screen.getByText('Physical Factors')).toBeInTheDocument();
  });

  it('renders arm sensitivity section', () => {
    render(<StepPhysical />);
    expect(screen.getByText('Arm/Elbow Sensitivity')).toBeInTheDocument();
  });

  it('renders grip size buttons', () => {
    render(<StepPhysical />);
    expect(screen.getByText('Grip Size (optional)')).toBeInTheDocument();
    expect(screen.getByText('4 1/2"')).toBeInTheDocument();
  });

  it('renders handle length preference', () => {
    render(<StepPhysical />);
    expect(screen.getByText('Handle Length Preference (optional)')).toBeInTheDocument();
  });

  it('renders weight tolerance section', () => {
    render(<StepPhysical />);
    expect(screen.getByText('Weight Tolerance')).toBeInTheDocument();
  });

  it('toggles arm sensitivity switch', async () => {
    const user = userEvent.setup();
    render(<StepPhysical />);
    const switchEl = screen.getByRole('switch');
    await user.click(switchEl);
    expect(mockSetPhysical).toHaveBeenCalledWith({ arm_sensitivity: true });
  });

  it('calls setPhysical when grip size is selected', async () => {
    const user = userEvent.setup();
    render(<StepPhysical />);
    await user.click(screen.getByText('4 1/2"'));
    expect(mockSetPhysical).toHaveBeenCalledWith({ grip_size: '4_1/2' });
  });

  it('calls setPhysical when weight tolerance is selected', async () => {
    const user = userEvent.setup();
    render(<StepPhysical />);
    await user.click(screen.getByText('Heavy'));
    expect(mockSetPhysical).toHaveBeenCalledWith({ weight_tolerance: 'heavy' });
  });

  it('shows sensitivity alert when arm sensitivity is on', () => {
    mockShouldShowArmSensitivityDetails.mockReturnValue(true);
    mockUseOnboardingStore.mockReturnValue({
      profile: { physical: { arm_sensitivity: true, weight_tolerance: 'medium' } },
      setPhysical: mockSetPhysical,
      shouldShowArmSensitivityDetails: mockShouldShowArmSensitivityDetails,
    });
    render(<StepPhysical />);
    expect(screen.getByText(/lower vibration/)).toBeInTheDocument();
  });
});
