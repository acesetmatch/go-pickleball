import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaddleCard } from '../PaddleCard';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

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
    spin: 75,
    twist_weight: 6.5,
    swing_weight: 115,
    balance_point: 20,
  },
  image_url: 'https://example.com/paddle.jpg',
  buy_url: 'https://example.com/buy',
  price: 149.99,
};

describe('PaddleCard', () => {
  it('renders brand and model name', () => {
    render(<PaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('Selkirk AMPED Epic')).toBeInTheDocument();
  });

  it('renders shape and surface', () => {
    render(<PaddleCard paddle={mockPaddle} />);
    expect(screen.getByText(/Standard.*Textured/)).toBeInTheDocument();
  });

  it('renders price badge', () => {
    render(<PaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('renders specs', () => {
    render(<PaddleCard paddle={mockPaddle} />);
    expect(screen.getByText(/Weight:/)).toBeInTheDocument();
    expect(screen.getByText(/Core:/)).toBeInTheDocument();
    expect(screen.getByText(/Dimensions:/)).toBeInTheDocument();
  });

  it('renders view details button', () => {
    render(<PaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('renders buy now button when buy_url exists', () => {
    render(<PaddleCard paddle={mockPaddle} />);
    expect(screen.getByText('Buy Now')).toBeInTheDocument();
  });

  it('navigates to details page on view details click', () => {
    render(<PaddleCard paddle={mockPaddle} />);
    fireEvent.click(screen.getByText('View Details'));
    expect(mockPush).toHaveBeenCalledWith('/paddles/selkirk-amped-epic');
  });

  it('renders image when image_url is provided', () => {
    const { container } = render(<PaddleCard paddle={mockPaddle} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('does not render image when image_url is missing', () => {
    const paddleNoImage = { ...mockPaddle, image_url: undefined };
    const { container } = render(<PaddleCard paddle={paddleNoImage} />);
    const img = container.querySelector('img');
    expect(img).not.toBeInTheDocument();
  });
});
