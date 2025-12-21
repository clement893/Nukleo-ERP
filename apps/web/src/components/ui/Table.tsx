import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  hover?: boolean;
}

export function Table({ children, className, striped = false, hover = false }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={clsx(
          'min-w-full divide-y divide-gray-200',
          className
        )}
      >
        {children}
      </table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead className={clsx('bg-gray-50', className)}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  hover?: boolean;
}

export function TableBody({ children, className, striped = false, hover = false }: TableBodyProps) {
  return (
    <tbody
      className={clsx(
        'bg-white divide-y divide-gray-200',
        striped && '[&>tr:nth-child(even)]:bg-gray-50',
        hover && '[&>tr:hover]:bg-gray-50',
        className
      )}
    >
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={clsx(
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export function TableHeader({
  children,
  className,
  sortable = false,
  sortDirection,
  onSort,
}: TableHeaderProps) {
  return (
    <th
      className={clsx(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        sortable && 'cursor-pointer select-none',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <span className="flex flex-col">
            <svg
              className={clsx(
                'w-3 h-3',
                sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </span>
        )}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={clsx('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)}>
      {children}
    </td>
  );
}

