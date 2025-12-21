'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

type DropdownItem =
  | {
      label: string;
      onClick: () => void;
      icon?: ReactNode;
      disabled?: boolean;
      divider?: false;
    }
  | {
      divider: true;
    };

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  position = 'bottom',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const positions = {
    bottom: 'top-full left-0 mt-1',
    top: 'bottom-full left-0 mb-1',
    left: 'right-full top-0 mr-1',
    right: 'left-full top-0 ml-1',
  };

  return (
    <div className={clsx('relative inline-block', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]',
            positions[position]
          )}
        >
          {items.map((item, index) => {
            if ('divider' in item && item.divider) {
              return <div key={index} className="border-t border-gray-200 my-1" />;
            }

            const dropdownItem = item as Exclude<DropdownItem, { divider: true }>;
            return (
              <button
                key={index}
                onClick={() => {
                  if (!dropdownItem.disabled) {
                    dropdownItem.onClick();
                    setIsOpen(false);
                  }
                }}
                disabled={dropdownItem.disabled}
                className={clsx(
                  'w-full px-4 py-2 text-left text-sm flex items-center space-x-2',
                  'hover:bg-gray-100 transition-colors',
                  dropdownItem.disabled && 'opacity-50 cursor-not-allowed',
                  className
                )}
              >
                {dropdownItem.icon && <span className="flex-shrink-0">{dropdownItem.icon}</span>}
                <span>{dropdownItem.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

