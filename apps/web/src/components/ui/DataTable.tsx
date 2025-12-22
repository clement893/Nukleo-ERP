'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './Table';
import Input from './Input';
import Button from './Button';
import Pagination from './Pagination';
import Dropdown from './Dropdown';
import type { DropdownItem } from './Dropdown';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: { label: string; value: string }[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  sortable?: boolean;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => DropdownItem[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  filterable = true,
  sortable = true,
  onRowClick,
  actions,
  className,
  emptyMessage = 'Aucune donnée disponible',
  loading = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const column = columns.find((col) => col.key === key);
        if (column) {
          result = result.filter((row) => {
            const rowValue = row[key];
            if (column.filterType === 'select') {
              return rowValue === value;
            }
            if (column.filterType === 'number') {
              return Number(rowValue) === Number(value);
            }
            return rowValue?.toString().toLowerCase().includes(value.toString().toLowerCase());
          });
        }
      }
    });

    // Apply sorting
    if (sortColumn && sortable) {
      result.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns, sortable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const handleFilterChange = useCallback((columnKey: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const filterableColumns = columns.filter((col) => col.filterable !== false);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {searchable && (
              <div className="flex-1">
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
            )}

            {filterable && filterableColumns.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filterableColumns.map((column) => {
                  if (column.filterType === 'select' && column.filterOptions) {
                    return (
                      <select
                        key={column.key}
                        value={String(filters[column.key] ?? '')}
                        onChange={(e) => handleFilterChange(column.key, e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">Tous {column.label}</option>
                        {column.filterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    );
                  }
                  return (
                    <Input
                      key={column.key}
                      placeholder={`Filtrer ${column.label}`}
                      value={String(filters[column.key] ?? '')}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-48"
                    />
                  );
                })}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>

          {filteredData.length !== data.length && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {filteredData.length} résultat(s) sur {data.length}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableHeader
                  key={column.key}
                  sortable={sortable && column.sortable !== false}
                  sortDirection={sortColumn === column.key ? sortDirection : null}
                  onSort={sortable && column.sortable !== false ? () => handleSort(column.key) : undefined}
                >
                  {column.label}
                </TableHeader>
              ))}
              {actions && <TableHeader>Actions</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody striped hover>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">{emptyMessage}</div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]?.toString() || '-'}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Dropdown trigger={<Button variant="ghost" size="sm">⋯</Button>} items={actions(row)} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, filteredData.length)} sur {filteredData.length}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

