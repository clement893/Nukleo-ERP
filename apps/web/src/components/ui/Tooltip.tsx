/**
 * Tooltip Component
 * Tooltip component with glassmorphism design
 */

'use client';

import { type ReactNode, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--color-foreground)]',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--color-foreground)]',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--color-foreground)]',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--color-foreground)]',
};

export default function Tooltip({
  content,
  children,
  position = 'top',
  className,
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();

      // Check if tooltip goes off screen and adjust position
      let newPosition = position;

      if (position === 'top' && rect.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && rect.bottom > window.innerHeight) {
        newPosition = 'top';
      } else if (position === 'left' && rect.left < 0) {
        newPosition = 'right';
      } else if (position === 'right' && rect.right > window.innerWidth) {
        newPosition = 'left';
      }

      setAdjustedPosition(newPosition);
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={clsx(
            'absolute z-[9999] px-3 py-2 text-xs font-medium',
            'glass-card rounded-lg shadow-lg',
            'text-foreground',
            'whitespace-nowrap pointer-events-none',
            'animate-fade-in',
            positionClasses[adjustedPosition],
            className
          )}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={clsx(
              'absolute w-0 h-0 border-[5px] border-transparent',
              arrowClasses[adjustedPosition]
            )}
            style={{
              filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.1))',
            }}
          />
        </div>
      )}
    </div>
  );
}
