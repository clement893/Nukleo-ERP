/**
 * EmployeePortalHeader Component
 * 
 * Reusable header component with Nukleo gradient design
 * for employee portal pages.
 */

'use client';

import { ReactNode } from 'react';

interface EmployeePortalHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmployeePortalHeader({ 
  title, 
  description,
  action 
}: EmployeePortalHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
      <div className="relative p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {title}
            </h1>
            {description && (
              <p className="text-white/80 text-lg">{description}</p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
