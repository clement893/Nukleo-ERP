import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../Select';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders with label', () => {
    render(<Select label="Select an option" options={options} />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders with options', () => {
    render(<Select options={options} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('calls onChange when option is selected', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Select options={options} onChange={handleChange} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'option2');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<Select options={options} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Select options={options} disabled />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Select options={options} className="custom-class" />
    );
    const select = container.querySelector('select');
    expect(select).toHaveClass('custom-class');
  });
});

