import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaddleCollectionLoading } from '../PaddleCollectionLoading';

describe('PaddleCollectionLoading', () => {
  it('renders the title', () => {
    render(<PaddleCollectionLoading />);
    expect(screen.getByText('Paddle Collection')).toBeInTheDocument();
  });

  it('renders 6 skeleton cards', () => {
    const { container } = render(<PaddleCollectionLoading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });
});
