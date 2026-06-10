import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingStore } from '@/store/onboarding';
import QuickStartProfiles from '../QuickStartProfiles';

vi.mock('@/store/onboarding', () => ({
  useOnboardingStore: vi.fn(),
}));

const mockSetPlayContext = vi.fn();
const mockSetStyle = vi.fn();
const mockSetPhysical = vi.fn();
const mockSetSetupPain = vi.fn();
const mockSetEnvironment = vi.fn();
const mockSetPreferences = vi.fn();
const mockSetAspirations = vi.fn();

const mockUseOnboardingStore = useOnboardingStore as any;

describe('QuickStartProfiles', () => {
  const mockOnSelect = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue({
      profile: {},
      setPlayContext: mockSetPlayContext,
      setStyle: mockSetStyle,
      setPhysical: mockSetPhysical,
      setSetupPain: mockSetSetupPain,
      setEnvironment: mockSetEnvironment,
      setPreferences: mockSetPreferences,
      setAspirations: mockSetAspirations,
    });
  });

  it('renders the title', () => {
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    expect(screen.getByText('Quick Start')).toBeInTheDocument();
  });

  it('renders all profile cards', () => {
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    expect(screen.getByText('Beginner Learning')).toBeInTheDocument();
    expect(screen.getByText('Recreational Player')).toBeInTheDocument();
    expect(screen.getByText('Competitive Tournament')).toBeInTheDocument();
    expect(screen.getByText('Elite/Pro Level')).toBeInTheDocument();
  });

  it('renders skip button', () => {
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    expect(screen.getByText('Skip - Answer Manually')).toBeInTheDocument();
  });

  it('renders continue button disabled by default', () => {
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    expect(screen.getByText('Continue with Selected Profile')).toBeDisabled();
  });

  it('enables continue button after selecting a profile', async () => {
    const user = userEvent.setup();
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    await user.click(screen.getByText('Beginner Learning'));
    expect(screen.getByText('Continue with Selected Profile')).not.toBeDisabled();
  });

  it('calls onSelect when continuing with a selected profile', async () => {
    const user = userEvent.setup();
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    await user.click(screen.getByText('Beginner Learning'));
    await user.click(screen.getByText('Continue with Selected Profile'));
    expect(mockOnSelect).toHaveBeenCalledWith('beginner');
  });

  it('calls onSkip when skip button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    await user.click(screen.getByText('Skip - Answer Manually'));
    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('pre-fills store when a profile is selected', async () => {
    const user = userEvent.setup();
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    await user.click(screen.getByText('Beginner Learning'));
    expect(mockSetPlayContext).toHaveBeenCalled();
    expect(mockSetStyle).toHaveBeenCalled();
    expect(mockSetPhysical).toHaveBeenCalled();
    expect(mockSetSetupPain).toHaveBeenCalled();
    expect(mockSetEnvironment).toHaveBeenCalled();
    expect(mockSetPreferences).toHaveBeenCalled();
    expect(mockSetAspirations).toHaveBeenCalled();
  });

  it('shows checkmark on selected profile', () => {
    render(<QuickStartProfiles onSelect={mockOnSelect} onSkip={mockOnSkip} />);
    expect(screen.queryByText('Most Popular')).toBeInTheDocument();
    expect(screen.queryByText('Great for Most')).toBeInTheDocument();
    expect(screen.queryByText('Serious Players')).toBeInTheDocument();
    expect(screen.queryByText('Top 1%')).toBeInTheDocument();
  });
});
