import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressiveSection, InlineExpansion } from '../ProgressiveSection';

describe('ProgressiveSection', () => {
  const defaultProps = {
    title: 'Advanced Details',
    accuracyBoost: '+15%',
    coreQuestions: <div>Core question content</div>,
    detailedQuestions: <div>Detailed question content</div>,
  };

  it('renders core questions', () => {
    render(<ProgressiveSection {...defaultProps} />);
    expect(screen.getByText('Core question content')).toBeInTheDocument();
  });

  it('renders expand button with title and accuracy boost', () => {
    render(<ProgressiveSection {...defaultProps} />);
    expect(screen.getByText('Advanced Details')).toBeInTheDocument();
    expect(screen.getByText('+15% accuracy')).toBeInTheDocument();
  });

  it('hides detailed questions by default', () => {
    render(<ProgressiveSection {...defaultProps} />);
    expect(screen.queryByText('Detailed question content')).not.toBeInTheDocument();
  });

  it('shows detailed questions when expanded', () => {
    render(<ProgressiveSection {...defaultProps} />);
    fireEvent.click(screen.getByText('Advanced Details'));
    expect(screen.getByText('Detailed question content')).toBeInTheDocument();
  });

  it('shows detailed questions when defaultExpanded is true', () => {
    render(<ProgressiveSection {...defaultProps} defaultExpanded={true} />);
    expect(screen.getByText('Detailed question content')).toBeInTheDocument();
  });

  it('toggles between expand and collapse', () => {
    render(<ProgressiveSection {...defaultProps} />);
    fireEvent.click(screen.getByText('Advanced Details'));
    expect(screen.getByText('Hide Detailed Questions')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hide Detailed Questions'));
    expect(screen.queryByText('Detailed question content')).not.toBeInTheDocument();
  });
});

describe('InlineExpansion', () => {
  const defaultProps = {
    label: 'More Options',
    accuracyBoost: '+10%',
    children: <div>Expanded content</div>,
  };

  it('renders collapsed state with label', () => {
    render(<InlineExpansion {...defaultProps} />);
    expect(screen.getByText('More Options')).toBeInTheDocument();
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('hides content by default', () => {
    render(<InlineExpansion {...defaultProps} />);
    expect(screen.queryByText('Expanded content')).not.toBeInTheDocument();
  });

  it('shows content when expanded', () => {
    render(<InlineExpansion {...defaultProps} />);
    fireEvent.click(screen.getByText('More Options'));
    expect(screen.getByText('Expanded content')).toBeInTheDocument();
  });

  it('shows content when defaultExpanded is true', () => {
    render(<InlineExpansion {...defaultProps} defaultExpanded={true} />);
    expect(screen.getByText('Expanded content')).toBeInTheDocument();
  });
});
