/**
 * ProgressBar Component
 * 
 * Visual progress indicator during navigation for better UX feedback.
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ProgressBar() {
  const pathname = usePathname();

  useEffect(() => {
    const progressBar = document.getElementById('navigation-progress');
    if (progressBar) {
      // Reset and animate progress bar
      progressBar.style.width = '0%';
      progressBar.style.opacity = '1';
      
      setTimeout(() => {
        progressBar.style.width = '70%';
      }, 10);
      
      setTimeout(() => {
        progressBar.style.width = '100%';
      }, 200);
      
      setTimeout(() => {
        progressBar.style.opacity = '0';
        setTimeout(() => {
          progressBar.style.width = '0%';
        }, 300);
      }, 300);
    }
  }, [pathname]);

  return (
    <div
      id="navigation-progress"
      className="fixed top-0 left-0 h-0.5 bg-nukleo-gradient z-50 transition-all duration-300 pointer-events-none"
      style={{ width: '0%', opacity: 0 }}
    />
  );
}
