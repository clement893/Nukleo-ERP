/**
 * Command Palette Component
 * Modern ⌘K command palette with glassmorphism design
 */

'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Search } from 'lucide-react';
import { useCommandPaletteState } from './CommandPalette.hooks';
import type { Command, CommandPaletteProps } from './CommandPalette.types';

export type { Command, CommandPaletteProps };

export default function CommandPalette({
  commands,
  isOpen,
  onClose,
  placeholder = 'Tapez une commande ou recherchez...',
  emptyState,
  className,
}: CommandPaletteProps) {
  const { search, setSearch, selectedIndex, filteredCommands, groupedCommands } =
    useCommandPaletteState(commands, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] glass-overlay animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Command Palette */}
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div
          className={clsx(
            'glass-modal rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto',
            'max-h-[70vh] flex flex-col overflow-hidden',
            'animate-scale-in',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border/30">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground text-base"
              autoFocus
              aria-label="Search commands"
            />
            <kbd className="hidden sm:inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-muted-foreground glass-card rounded-lg border border-border/30">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {filteredCommands.length === 0 ? (
              emptyState || (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
                </div>
              )
            ) : (
              <div className="space-y-1">
                {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category}>
                    {category !== 'Autres' && (
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </div>
                    )}
                    {categoryCommands.map((command) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={command.id}
                          onClick={() => {
                            command.action();
                            onClose();
                          }}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                            isSelected
                              ? 'glass-card-active text-primary shadow-sm'
                              : 'text-foreground hover:glass-card-hover'
                          )}
                        >
                          {command.icon && (
                            <span className={clsx(
                              'flex-shrink-0 transition-colors',
                              isSelected ? 'text-primary' : 'text-muted-foreground'
                            )}>
                              {command.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{command.label}</div>
                            {command.description && (
                              <div className="text-sm text-muted-foreground truncate">
                                {command.description}
                              </div>
                            )}
                          </div>
                          {command.shortcut && (
                            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-muted-foreground glass-card rounded-lg border border-border/30">
                              {command.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 glass-card border border-border/30 rounded-md">↑</kbd>
                <kbd className="px-2 py-1 glass-card border border-border/30 rounded-md">↓</kbd>
                <span>Naviguer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 glass-card border border-border/30 rounded-md">Enter</kbd>
                <span>Sélectionner</span>
              </div>
            </div>
            <div className="font-medium">
              {filteredCommands.length} résultat{filteredCommands.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook for using Command Palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
