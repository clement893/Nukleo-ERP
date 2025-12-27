/**
 * ButtonLink Component
 * 
 * A Button component that acts as a Link for navigation.
 * Combines Button styling with Link functionality from next-intl.
 * 
 * @example
 * ```tsx
 * <ButtonLink href="/dashboard" variant="primary">
 *   Go to Dashboard
 * </ButtonLink>
 * ```
 */

'use client';

import { Link } from '@/i18n/routing';
import { type ComponentProps } from 'react';
import Button, { type ButtonProps } from './Button';
import { clsx } from 'clsx';

export interface ButtonLinkProps extends Omit<ButtonProps, 'onClick' | 'disabled'> {
  /** Link href */
  href: string;
  /** Open in new tab */
  target?: '_blank' | '_self';
  /** Link rel attribute */
  rel?: string;
}

/**
 * ButtonLink - A Button that acts as a Link
 * 
 * This component combines Button styling with Link navigation.
 * It prevents the common issue of Button inside Link not working correctly.
 */
export default function ButtonLink({
  href,
  target,
  rel,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  ...linkProps
}: ButtonLinkProps) {
  // If target is _blank, add rel="noopener noreferrer" for security
  const linkRel = target === '_blank' ? rel || 'noopener noreferrer' : rel;

  return (
    <Link
      href={href}
      target={target}
      rel={linkRel}
      className={clsx(
        'inline-block',
        fullWidth && 'w-full',
        className
      )}
      {...linkProps}
    >
      <Button
        variant={variant}
        size={size}
        loading={loading}
        fullWidth={fullWidth}
        className="w-full"
        asChild
      >
        {children}
      </Button>
    </Link>
  );
}

