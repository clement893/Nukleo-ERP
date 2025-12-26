'use client';

import { memo } from 'react';
import { clsx } from 'clsx';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './Table';
import Dropdown from './Dropdown';
import type { DropdownItem } from './Dropdown';
import Button from './Button';
import { useTableData } from '@/hooks/data/useTableData';
import type { Column } from '@/hooks/data/useTableData';
import TableSearchBar from './TableSearchBar';
import TableFilters from './TableFilters';
import TablePagination from './TablePagination';

// Re-export Column type for backward compatibility
export type { Column };

/**
 * DataTable Component
 * 
 * Advanced data table with sorting, filtering, pagination, and search.
 * Supports custom cell rendering, row actions, and click handlers.
 * 
 * @example
 * ```tsx
 * const columns: Column<User>[] = [
 *   { key: 'name', label: 'Name', sortable: true },
 *   { key: 'email', label: 'Email', sortable: true },
 * ];
 * 
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   onRowClick={(user) => handleUserClick(user)}
 *   searchable
 *   pagination
 * />
 * ```
 */
export interface DataTableProps<T> {
  /** Table data array */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Number of items per page */
  pageSize?: number;
  /** Enable search functionality */
  searchable?: boolean;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Enable filtering */
  filterable?: boolean;
  /** Enable sorting */
  sortable?: boolean;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Row actions dropdown items */
  actions?: (row: T) => DropdownItem[];
  /** Additional CSS classes */
  className?: string;
  /** Message to display when table is empty */
  emptyMessage?: string;
  /** Show loading state */
  loading?: boolean;
}

function DataTable<T extends Record<string, unknown>>({
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
  // Use shared hook for all table data management
  const {
    paginatedData,
    filteredData,
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    clearFilters,
    sortColumn,
    sortDirection,
    handleSort,
    currentPage,
    setCurrentPage,
    totalPages,
    hasActiveFilters,
  } = useTableData(data, columns, {
    searchable,
    filterable,
    sortable,
    pageSize,
  });

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {searchable && (
              <div className="flex-1">
                <TableSearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}

            {filterable && (
              <TableFilters
                columns={columns}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            )}
          </div>

          {hasActiveFilters && filteredData.length !== data.length && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {filteredData.length} résultat(s) sur {data.length}
            </div>
          )}
        </div>
      )}

      {/* Table - Responsive wrapper for horizontal scroll on mobile */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table component already has overflow-x-auto, but we add an extra wrapper for better mobile UX */}
        <div className="overflow-x-auto">
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
                {actions && (
                  <TableHeader className="sticky right-0 bg-gray-50 dark:bg-gray-800 z-10 shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(0,0,0,0.3)]">
                    Actions
                  </TableHeader>
                )}
              </TableRow>
            </TableHead>
            <TableBody striped hover>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-500"></div>
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
                    <TableCell 
                      onClick={(e) => e.stopPropagation()} 
                      className="sticky right-0 bg-white dark:bg-gray-900 z-10 shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                    >
                      <Dropdown 
                        trigger={
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="min-w-[44px] min-h-[44px] p-2"
                            aria-label="Row actions"
                          >
                            ⋯
                          </Button>
                        } 
                        items={actions(row)} 
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default memo(DataTable) as typeof DataTable;

