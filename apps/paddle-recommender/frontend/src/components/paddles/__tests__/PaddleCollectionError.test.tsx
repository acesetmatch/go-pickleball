import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaddleCollectionError } from '../PaddleCollectionError';

describe('PaddleCollectionError', () => {
  it('renders the error title', () => {
    render(<PaddleCollectionError message="Test error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders the error message', () => {
    render(<PaddleCollectionError message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders the paddle collection title', () => {
    render(<PaddleCollectionError message="Error message" />);
    expect(screen.getByText('Paddle Collection')).toBeInTheDocument();
  });
});
