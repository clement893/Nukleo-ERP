import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Input helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('does not render helper text when error is present', () => {
    render(
      <Input
        error="Error message"
        helperText="Helper text"
      />
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('renders with left icon', () => {
    const leftIcon = <span data-testid="left-icon">@</span>;
    render(<Input leftIcon={leftIcon} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const rightIcon = <span data-testid="right-icon">✓</span>;
    render(<Input rightIcon={rightIcon} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<Input label="Email" required />);
    const label = screen.getByText('Email');
    const requiredIndicator = label.querySelector('.text-red-500');
    expect(requiredIndicator).toBeInTheDocument();
  });

  it('forwards HTML input props', () => {
    render(<Input type="email" placeholder="Enter email" />);
    const input = screen.getByPlaceholderText('Enter email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('applies error styles when error is present', () => {
    const { container } = render(<Input error="Error" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-red-500');
  });

  it('applies custom className', () => {
    const { container } = render(<Input className="custom-class" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-class');
  });
});

