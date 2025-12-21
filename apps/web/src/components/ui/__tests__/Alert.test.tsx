import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from '../Alert';

describe('Alert', () => {
  it('renders with children', () => {
    render(<Alert>Alert message</Alert>);
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Alert title="Alert Title">Alert message</Alert>);
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('renders with info variant by default', () => {
    const { container } = render(<Alert>Info alert</Alert>);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toHaveClass('bg-blue-50');
  });

  it('renders with success variant', () => {
    const { container } = render(<Alert variant="success">Success</Alert>);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toHaveClass('bg-green-50');
  });

  it('renders with warning variant', () => {
    const { container } = render(<Alert variant="warning">Warning</Alert>);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toHaveClass('bg-yellow-50');
  });

  it('renders with error variant', () => {
    const { container } = render(<Alert variant="error">Error</Alert>);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toHaveClass('bg-red-50');
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<Alert onClose={handleClose}>Alert</Alert>);
    
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onClose is not provided', () => {
    render(<Alert>Alert</Alert>);
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    const icon = <span data-testid="custom-icon">Icon</span>;
    render(<Alert icon={icon}>Alert</Alert>);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Alert className="custom-class">Alert</Alert>);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toHaveClass('custom-class');
  });

  it('has correct role attribute', () => {
    const { container } = render(<Alert>Alert</Alert>);
    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });
});

