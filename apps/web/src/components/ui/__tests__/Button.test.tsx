import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders with primary variant by default', () => {
    const { container } = render(<Button>Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('renders with secondary variant', () => {
    const { container } = render(<Button variant="secondary">Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gray-600');
  });

  it('renders with outline variant', () => {
    const { container } = render(<Button variant="outline">Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('border-2');
    expect(button).toHaveClass('border-blue-600');
  });

  it('renders with ghost variant', () => {
    const { container } = render(<Button variant="ghost">Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('text-gray-700');
  });

  it('renders with small size', () => {
    const { container } = render(<Button size="sm">Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('py-2');
    expect(button).toHaveClass('text-sm');
  });

  it('renders with medium size by default', () => {
    const { container } = render(<Button>Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-6');
    expect(button).toHaveClass('py-3');
    expect(button).toHaveClass('text-base');
  });

  it('renders with large size', () => {
    const { container } = render(<Button size="lg">Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-8');
    expect(button).toHaveClass('py-4');
    expect(button).toHaveClass('text-lg');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click</Button>);
    
    await user.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const { container } = render(<Button disabled>Click</Button>);
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Click</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('forwards HTML button props', () => {
    render(<Button type="submit" aria-label="Submit">Click</Button>);
    const button = screen.getByLabelText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });
});

