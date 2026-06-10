import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CombinedPaddleCard } from '../CombinedPaddleCard';

const mockPaddle = {
  company: 'Selkirk',
  paddleName: 'AMPED Epic',
  sources: ['mattspickleball', 'pickleballeffect'],
  sourceCount: 2,
  shape: 'Standard',
  coreThickness: 16,
  weight: 8.0,
  swingWeight: 115,
  twistWeight: 6.5,
  spinRPM: 1800,
  paddleRating: '8.5/10',
  bestOffer: { price: 149.99, source: 'mattspickleball', purchaseLink: 'https://example.com' },
};

describe('CombinedPaddleCard', () => {
  it('renders paddle company and name', () => {
    render(<CombinedPaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('Selkirk AMPED Epic')).toBeInTheDocument();
  });

  it('renders source badges', () => {
    render(<CombinedPaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('MPB')).toBeInTheDocument();
    expect(screen.getByText('PBE')).toBeInTheDocument();
  });

  it('renders source count badge', () => {
    render(<CombinedPaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('2 sources')).toBeInTheDocument();
  });

  it('renders price when bestOffer exists', () => {
    render(<CombinedPaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('renders spec labels', () => {
    const { container } = render(<CombinedPaddleCard paddle={mockPaddle} />);
    expect(container.textContent).toContain('Shape:');
    expect(container.textContent).toContain('Core:');
    expect(container.textContent).toContain('Weight:');
  });

  it('renders more details link', () => {
    render(<CombinedPaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('More Details')).toBeInTheDocument();
  });

  it('does not render price when bestOffer is missing', () => {
    const paddleWithoutPrice = { ...mockPaddle, bestOffer: undefined };
    render(<CombinedPaddleCard paddle={paddleWithoutPrice} />);
    expect(screen.queryByText('$149.99')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CombinedPaddleCard paddle={mockPaddle} className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
