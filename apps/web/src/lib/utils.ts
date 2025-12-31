/**
 * Utility functions
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Combines class names using clsx
 * This is a simple wrapper around clsx for className merging
 * 
 * @param inputs - Class names to combine
 * @returns Combined class string
 * 
 * @example
 * ```tsx
 * cn('foo', 'bar', { baz: true }) // => 'foo bar baz'
 * cn('base', isActive && 'active') // => 'base active' or 'base'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
