import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card', () => {
  it('renders with children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('renders with default styles', () => {
    const { container } = render(
      <Card>
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('dark:bg-gray-800');
  });
});

