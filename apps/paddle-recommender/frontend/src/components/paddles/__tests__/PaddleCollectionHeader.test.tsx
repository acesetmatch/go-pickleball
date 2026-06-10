import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaddleCollectionHeader } from '../PaddleCollectionHeader';

const defaultProps = {
  totalCount: 10,
  filteredCount: 8,
  brands: ['Selkirk', 'JOOLA'],
  brandCounts: { Selkirk: 5, JOOLA: 3 },
  selectedBrand: 'all',
  onBrandChange: vi.fn(),
  searchQuery: '',
  onSearchChange: vi.fn(),
};

describe('PaddleCollectionHeader', () => {
  it('renders the title', () => {
    render(<PaddleCollectionHeader {...defaultProps} />);
    expect(screen.getByText('Paddle Collection')).toBeInTheDocument();
  });

  it('renders filtered count badge', () => {
    render(<PaddleCollectionHeader {...defaultProps} />);
    expect(screen.getByText('8 paddles')).toBeInTheDocument();
  });

  it('renders singular paddle count', () => {
    render(<PaddleCollectionHeader {...defaultProps} filteredCount={1} />);
    expect(screen.getByText('1 paddle')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<PaddleCollectionHeader {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search paddles...')).toBeInTheDocument();
  });

  it('renders brand select with all brands option', () => {
    render(<PaddleCollectionHeader {...defaultProps} />);
    expect(screen.getByText('Brand:')).toBeInTheDocument();
  });

  it('updates search input value', async () => {
    const user = userEvent.setup();
    render(<PaddleCollectionHeader {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search paddles...');
    await user.type(input, 'selkirk');
    expect(input).toHaveValue('selkirk');
  });

  it('calls onSearchChange after debounce', async () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    render(<PaddleCollectionHeader {...defaultProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Search paddles...');
    fireEvent.change(input, { target: { value: 'test' } });
    vi.runAllTimers();
    expect(onSearchChange).toHaveBeenCalledWith('test');
    vi.useRealTimers();
  });

  it('syncs input value with searchQuery prop', () => {
    const { rerender } = render(<PaddleCollectionHeader {...defaultProps} searchQuery="joola" />);
    const input = screen.getByPlaceholderText('Search paddles...');
    expect(input).toHaveValue('joola');
  });
});
