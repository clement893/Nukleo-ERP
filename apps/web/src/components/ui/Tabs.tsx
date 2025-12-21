'use client';

import { ReactNode, useState, createContext, useContext } from 'react';
import { clsx } from 'clsx';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  children: ReactNode;
  defaultTab?: string;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function Tabs({
  children,
  defaultTab,
  className,
  variant = 'default',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || '');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={clsx('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabList must be used within Tabs');

  return (
    <div
      className={clsx(
        'flex border-b border-gray-200 space-x-1',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabProps {
  children: ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

export function Tab({ children, value, className, disabled }: TabProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={clsx(
        'px-4 py-2 text-sm font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer',
        isActive
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300',
        className
      )}
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}

interface TabPanelsProps {
  children: ReactNode;
  className?: string;
}

export function TabPanels({ children, className }: TabPanelsProps) {
  return <div className={className}>{children}</div>;
}

interface TabPanelProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function TabPanel({ children, value, className }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  const { activeTab } = context;

  if (activeTab !== value) return null;

  return (
    <div
      className={clsx('mt-4', className)}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
    >
      {children}
    </div>
  );
}

