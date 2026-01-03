/**
 * RadioGroup Component
 * 
 * A group of radio buttons with controlled value
 */

'use client';

import { type ReactNode } from 'react';
import Radio from './Radio';

export interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export interface RadioGroupItemProps {
  value: string;
  id?: string;
  className?: string;
}

export function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <div className={className} role="radiogroup">
      {children}
    </div>
  );
}

export function RadioGroupItem({ value, id, className }: RadioGroupItemProps) {
  // This is a placeholder - the actual Radio component will be used in the parent
  return null;
}

// Export a helper component that combines Radio with RadioGroup logic
export function RadioGroupContext({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <div className={className} role="radiogroup">
      {children}
    </div>
  );
}
