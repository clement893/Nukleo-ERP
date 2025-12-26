import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Table({ children, className, style }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-1 px-1" style={style}>
      <table
        className={clsx(
          'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
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
  style?: React.CSSProperties;
}

export function TableHead({ children, className, style }: TableHeadProps) {
  return (
    <thead className={clsx('bg-gray-50 dark:bg-gray-800', className)} style={style}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}

export function TableBody({ children, className, striped = false, hover = false, style }: TableBodyProps) {
  return (
    <tbody
      className={clsx(
        'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700',
        striped && '[&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-gray-800',
        hover && '[&>tr:hover]:bg-gray-50 dark:[&>tr:hover]:bg-gray-800',
        className
      )}
      style={style}
    >
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function TableRow({ children, className, onClick, style }: TableRowProps) {
  return (
    <tr
      className={clsx(
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={style}
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
  style?: React.CSSProperties;
}

export function TableHeader({
  children,
  className,
  sortable = false,
  sortDirection,
  onSort,
  style,
}: TableHeaderProps) {
  return (
    <th
      className={clsx(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
        sortable && 'cursor-pointer select-none',
        className
      )}
      onClick={sortable ? onSort : undefined}
      style={style}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <span className="flex flex-col">
            <svg
              className={clsx(
                'w-3 h-3',
                sortDirection === 'asc' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
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
  colSpan?: number;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
  style?: React.CSSProperties;
}

export function TableCell({ children, className, colSpan, onClick, style }: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      onClick={onClick}
      className={clsx('px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100', className)}
      style={style}
    >
      {children}
    </td>
  );
}

