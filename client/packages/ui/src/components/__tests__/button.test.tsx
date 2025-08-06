import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../button';

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('renders brand-secondary variant', () => {
    render(<Button variant="brand-secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white-brand', 'text-dark-brand', 'border-dark-brand');
  });

  it('renders brand-primary variant', () => {
    render(<Button variant="brand-primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-purple-brand', 'text-white-brand');
  });

  it('renders brand-success variant', () => {
    render(<Button variant="brand-success">Success</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-green-brand', 'text-dark-brand');
  });

  it('applies emphasized shadow to brand variants', () => {
    render(<Button variant="brand-secondary" emphasized>Emphasized</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('shadow-[1px_2px_0px_0px_#0a232e]');
  });

  it('does not apply emphasized shadow when emphasized is false', () => {
    render(<Button variant="brand-secondary" emphasized={false}>Not Emphasized</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('shadow-[1px_2px_0px_0px_#0a232e]');
  });

  it('applies correct sizing for brand variants', () => {
    // Test small size
    const { rerender } = render(<Button variant="brand-primary" size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('text-xs', 'rounded-[5px]');

    // Test default size (medium)
    rerender(<Button variant="brand-primary" size="default">Medium</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('text-sm', 'rounded-[5px]');

    // Test large size
    rerender(<Button variant="brand-primary" size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('text-[22px]', 'rounded-[10px]');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});