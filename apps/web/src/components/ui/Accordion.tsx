'use client';

import { ReactNode, useState } from 'react';
import { clsx } from 'clsx';

interface AccordionItem {
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export default function Accordion({
  items,
  allowMultiple = false,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(
    new Set(items.map((item, index) => (item.defaultOpen ? index : -1)).filter((i) => i !== -1))
  );

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {items.map((item, index) => {
        const isOpen = openItems.has(index);

        return (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{item.title}</span>
              <svg
                className={clsx(
                  'w-5 h-5 text-gray-500 transition-transform',
                  isOpen && 'transform rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

