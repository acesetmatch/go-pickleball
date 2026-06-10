import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RankingInput, SimpleRankingInput } from '../RankingInput';

const options = [
  { id: 'power', label: 'Power', description: 'Hit hard' },
  { id: 'control', label: 'Control', description: 'Place shots' },
  { id: 'spin', label: 'Spin', description: 'Spin shots' },
  { id: 'speed', label: 'Speed', description: 'Quickness' },
];

describe('RankingInput', () => {
  const defaultProps = {
    label: 'Play Styles',
    options,
    value: [],
    onChange: vi.fn(),
    minSelections: 1,
    maxSelections: 3,
  };

  it('renders label', () => {
    render(<RankingInput {...defaultProps} />);
    expect(screen.getByText('Play Styles')).toBeInTheDocument();
  });

  it('shows available options when none selected', () => {
    render(<RankingInput {...defaultProps} />);
    expect(screen.getByText('Available Options (Click to add)')).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
  });

  it('shows selection count', () => {
    render(<RankingInput {...defaultProps} />);
    expect(screen.getByText(/0 of 3 selected/)).toBeInTheDocument();
  });

  it('shows ranked items when values provided', () => {
    render(<RankingInput {...defaultProps} value={['power', 'control']} />);
    expect(screen.getByText('Your Rankings (Drag to reorder)')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('calls onChange when adding an option', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RankingInput {...defaultProps} onChange={onChange} />);
    await user.click(screen.getByText('Power'));
    expect(onChange).toHaveBeenCalledWith(['power']);
  });

  it('hides available options when max reached', () => {
    render(<RankingInput {...defaultProps} value={['power', 'control', 'spin']} />);
    expect(screen.queryByText('Available Options (Click to add)')).not.toBeInTheDocument();
  });

  it('shows description text for options', () => {
    render(<RankingInput {...defaultProps} />);
    expect(screen.getByText('Hit hard')).toBeInTheDocument();
    expect(screen.getByText('Place shots')).toBeInTheDocument();
  });
});

describe('SimpleRankingInput', () => {
  const defaultProps = {
    label: 'Items',
    items: ['Option A', 'Option B', 'Option C'],
    value: [],
    onChange: vi.fn(),
  };

  it('renders label', () => {
    render(<SimpleRankingInput {...defaultProps} />);
    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  it('creates ranking options from string items', () => {
    render(<SimpleRankingInput {...defaultProps} value={['Option A']} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });
});
