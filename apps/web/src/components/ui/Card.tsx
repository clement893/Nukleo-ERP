import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-md p-6',
        hover && 'hover:shadow-lg transition-shadow duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

