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
    expect(button).toHaveClass('bg-[#fefefe]', 'text-[#0a232e]', 'border-[#0a232e]');
  });

  it('renders brand-primary variant', () => {
    render(<Button variant="brand-primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#535fc8]', 'text-[#fefefe]');
  });

  it('renders brand-success variant', () => {
    render(<Button variant="brand-success">Success</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#00e095]', 'text-[#fefefe]');
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

  it('maintains backward compatibility with brand-primary variant', () => {
    render(<Button variant="brand-primary">Legacy</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#F8FAFC]', 'text-[#0A232E]');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});