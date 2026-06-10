import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PaddlePerformanceChart } from '../PaddlePerformanceChart';

const mockPaddle = {
  id: 'test-paddle',
  metadata: { brand: 'Test', model: 'Paddle' },
  specs: {
    shape: 'Standard',
    surface: 'Textured',
    average_weight: 8.0,
    core: 16,
    paddle_length: 16.5,
    paddle_width: 7.5,
    grip_length: 5.25,
    grip_type: 'Perforated',
    grip_circumference: 4.25,
  },
  performance: {
    power: 85,
    pop: 80,
    spin: 1800,
    twist_weight: 6.5,
    swing_weight: 115,
    balance_point: 20,
  },
};

describe('PaddlePerformanceChart', () => {
  it('returns null when no paddle provided', () => {
    const { container } = render(<PaddlePerformanceChart paddle={undefined as any} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders without crashing when paddle is provided', () => {
    const { container } = render(<PaddlePerformanceChart paddle={mockPaddle} />);
    expect(container.innerHTML).not.toBe('');
  });
});
