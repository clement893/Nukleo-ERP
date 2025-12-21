import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-gray-100');
  });

  it('renders with success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('renders with warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-yellow-100');
  });

  it('renders with error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-red-100');
  });

  it('renders with info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-blue-100');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Badge</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('custom-class');
  });

  it('has correct base classes', () => {
    const { container } = render(<Badge>Badge</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('items-center');
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('text-sm');
    expect(badge).toHaveClass('font-medium');
  });
});

