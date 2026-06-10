import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresetSlider, TradeoffSlider, PresetButtons } from '../PresetSlider';

describe('PresetSlider', () => {
  const defaultProps = {
    label: 'Weight',
    value: 5,
    onChange: vi.fn(),
    min: 0,
    max: 10,
    presets: [
      { value: 2, label: 'Light' },
      { value: 5, label: 'Medium' },
      { value: 8, label: 'Heavy' },
    ],
  };

  it('renders label', () => {
    render(<PresetSlider {...defaultProps} />);
    expect(screen.getByText('Weight')).toBeInTheDocument();
  });

  it('renders preset buttons', () => {
    render(<PresetSlider {...defaultProps} />);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Heavy')).toBeInTheDocument();
  });

  it('highlights selected preset as default variant', () => {
    render(<PresetSlider {...defaultProps} value={2} />);
    const lightButton = screen.getByText('Light').closest('button');
    expect(lightButton).toHaveClass('bg-primary');
  });

  it('calls onChange when preset is clicked', () => {
    const onChange = vi.fn();
    render(<PresetSlider {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText('Light'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('shows display value when showValue is true', () => {
    render(<PresetSlider {...defaultProps} showValue={true} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides display value when showValue is false', () => {
    render(<PresetSlider {...defaultProps} showValue={false} />);
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('uses formatValue function', () => {
    render(<PresetSlider {...defaultProps} formatValue={(v) => `${v}oz`} />);
    expect(screen.getByText('5oz')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PresetSlider {...defaultProps} description="Select weight" />);
    expect(screen.getByText('Select weight')).toBeInTheDocument();
  });

  it('renders slider', () => {
    const { container } = render(<PresetSlider {...defaultProps} />);
    const slider = container.querySelector('[role="slider"]');
    expect(slider).toBeInTheDocument();
  });
});

describe('TradeoffSlider', () => {
  const defaultProps = {
    label: 'Power vs Control',
    value: 0,
    onChange: vi.fn(),
    leftLabel: 'Power',
    rightLabel: 'Control',
  };

  it('renders label', () => {
    render(<TradeoffSlider {...defaultProps} />);
    expect(screen.getByText('Power vs Control')).toBeInTheDocument();
  });

  it('shows center label at value 0', () => {
    render(<TradeoffSlider {...defaultProps} value={0} />);
    expect(screen.getAllByText('Balanced').length).toBeGreaterThanOrEqual(1);
  });

  it('shows left preference text for negative values', () => {
    render(<TradeoffSlider {...defaultProps} value={-60} />);
    expect(screen.getByText('Much more power')).toBeInTheDocument();
  });

  it('shows right preference text for positive values', () => {
    render(<TradeoffSlider {...defaultProps} value={60} />);
    expect(screen.getByText('Much more control')).toBeInTheDocument();
  });
});

describe('PresetButtons', () => {
  const defaultProps = {
    label: 'Priority',
    value: 'control',
    onChange: vi.fn(),
    options: [
      { value: 'power', label: 'Power' },
      { value: 'control', label: 'Control' },
      { value: 'spin', label: 'Spin' },
    ],
  };

  it('renders label and options', () => {
    render(<PresetButtons {...defaultProps} />);
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Spin')).toBeInTheDocument();
  });

  it('highlights selected option', () => {
    render(<PresetButtons {...defaultProps} value="control" />);
    const controlButton = screen.getByText('Control').closest('button');
    expect(controlButton).toHaveClass('bg-primary');
  });

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn();
    render(<PresetButtons {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText('Power'));
    expect(onChange).toHaveBeenCalledWith('power');
  });
});
