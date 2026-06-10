import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaddleDetails } from '../PaddleDetails';

const mockPaddle = {
  id: 'selkirk-amped-epic',
  metadata: { brand: 'Selkirk', model: 'AMPED Epic' },
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
  image_url: 'https://example.com/paddle.jpg',
  buy_url: 'https://example.com/buy',
  price: 149.99,
};

const mockOnBack = vi.fn();

describe('PaddleDetails', () => {
  it('renders brand and model', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    expect(screen.getByText('Selkirk AMPED Epic')).toBeInTheDocument();
  });

  it('renders paddle ID', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    expect(screen.getByText('ID: selkirk-amped-epic')).toBeInTheDocument();
  });

  it('renders price badge', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('renders specifications table', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    expect(screen.getByText('Specifications')).toBeInTheDocument();
    expect(screen.getByText('Shape')).toBeInTheDocument();
    expect(screen.getByText('Surface')).toBeInTheDocument();
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
  });

  it('renders performance table', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('Spin')).toBeInTheDocument();
    expect(screen.getByText('Twist Weight')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    expect(screen.getByText('Back to List')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    fireEvent.click(screen.getByText('Back to List'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('renders buy now button', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    expect(screen.getByText('Buy Now')).toBeInTheDocument();
  });

  it('renders compare button', () => {
    render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    expect(screen.getByText('Compare')).toBeInTheDocument();
  });

  it('renders image when image_url is provided', () => {
    const { container } = render(<PaddleDetails paddle={mockPaddle} onBack={mockOnBack} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('does not render buy button when buy_url is missing', () => {
    const paddleNoBuy = { ...mockPaddle, buy_url: undefined };
    render(<PaddleDetails paddle={paddleNoBuy} onBack={mockOnBack} />);
    expect(screen.queryByText('Buy Now')).not.toBeInTheDocument();
  });
});
