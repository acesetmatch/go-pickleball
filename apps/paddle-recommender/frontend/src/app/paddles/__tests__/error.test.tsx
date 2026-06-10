import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '../error';

describe('Paddles Error Page', () => {
  const mockError = new Error('Failed to load paddles');
  const mockReset = vi.fn();

  it('renders the error title', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders the error message', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(screen.getByText('Failed to load paddles')).toBeInTheDocument();
  });

  it('renders default message when error has no message', () => {
    render(<ErrorPage error={new Error()} reset={mockReset} />);
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('renders try again button', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls reset when try again is clicked', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByText('Try again'));
    expect(mockReset).toHaveBeenCalled();
  });
});
