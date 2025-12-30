'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/ui';

interface MultiSelectFilterProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  className?: string;
}

export default function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onSelectionChange,
  className = '',
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      // Remove value
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      // Add value
      onSelectionChange([...selectedValues, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedValues.filter(v => v !== value));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[150px] hover:bg-muted transition-colors"
      >
        <span className="truncate">
          {selectedValues.length > 0 
            ? `${label} (${selectedValues.length})`
            : label
          }
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected badges */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedValues.map((value) => {
            const option = options.find(opt => opt.value === value);
            if (!option) return null;
            return (
              <Badge
                key={value}
                variant="default"
                className="flex items-center gap-1 px-1.5 py-0.5 text-xs"
              >
                <span className="truncate max-w-[100px]">{option.label}</span>
                <button
                  onClick={(e) => handleRemove(value, e)}
                  className="hover:text-destructive transition-colors"
                  aria-label={`Supprimer ${option.label}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-background border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Aucune option disponible
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2 ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className={`w-3 h-3 border border-border rounded flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary' : ''
                    }`}>
                      {isSelected && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span>{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
