import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CombinedPaddlePerformanceChart } from '../CombinedPaddlePerformanceChart';

const mockPaddle = {
  company: 'Selkirk',
  paddleName: 'AMPED Epic',
  sources: ['mattspickleball'],
  sourceCount: 1,
  spinPercentile: '75%',
  twistWeightPercentile: '60%',
  balancePoint: '50%',
  swingWeightPercentile: '80%',
  popPercentile: '70%',
  powerPercentile: '85%',
};

const mockPaddleInsufficient = {
  company: 'Selkirk',
  paddleName: 'Basic',
  sources: ['mattspickleball'],
  sourceCount: 1,
  spinPercentile: '75%',
  twistWeightPercentile: '60%',
};

describe('CombinedPaddlePerformanceChart', () => {
  it('returns null when no paddle provided', () => {
    const { container } = render(<CombinedPaddlePerformanceChart paddle={undefined as any} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders without crashing when sufficient data', () => {
    const { container } = render(<CombinedPaddlePerformanceChart paddle={mockPaddle} />);
    expect(container.innerHTML).not.toBe('');
  });

  it('shows insufficient data message when less than 3 metrics available', () => {
    render(<CombinedPaddlePerformanceChart paddle={mockPaddleInsufficient} />);
    expect(screen.getByText(/Insufficient performance data/)).toBeInTheDocument();
  });
});
