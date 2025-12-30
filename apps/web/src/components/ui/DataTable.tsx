'use client';

import { memo, useEffect, useRef } from 'react';
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
  /** Enable pagination */
  pagination?: boolean;
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
  /** Enable infinite scroll */
  infiniteScroll?: boolean;
  /** Has more data to load (for infinite scroll) */
  hasMore?: boolean;
  /** Loading more data (for infinite scroll) */
  loadingMore?: boolean;
  /** Callback when more data should be loaded */
  onLoadMore?: () => void;
  /** Enable virtualization for large lists (auto-enabled if data.length > 100) */
  virtualized?: boolean;
  /** Estimated row height for virtualization (default: 60px) */
  estimatedRowHeight?: number;
}

function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  pagination = true,
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  filterable = true,
  sortable = true,
  onRowClick,
  actions,
  className,
  emptyMessage = 'Aucune donnée disponible',
  loading = false,
  infiniteScroll = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  virtualized,
  estimatedRowHeight = 60,
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
    pageSize: pagination ? pageSize : Number.MAX_SAFE_INTEGER,
  });

  // Use filteredData when pagination is disabled
  const displayData = pagination ? paginatedData : filteredData;
  
  // Auto-enable virtualization for large lists (>100 items) if not explicitly disabled
  const shouldVirtualize = virtualized !== false && displayData.length > 100;
  
  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 5, // Render 5 extra items outside viewport for smoother scrolling
    enabled: shouldVirtualize,
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
        {/* Scroll hint for mobile users */}
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <span className="inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Swipe horizontally to view all columns
          </span>
        </div>
        {/* Table component already has overflow-x-auto, but we add an extra wrapper for better mobile UX */}
        <div 
          ref={parentRef}
          className={clsx(
            'overflow-x-auto relative',
            shouldVirtualize && 'overflow-y-auto',
            shouldVirtualize && 'h-[600px]' // Fixed height for virtualization
          )}
        >
          {/* Horizontal scroll indicator - shows on mobile when content overflows */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-10 md:hidden" aria-hidden="true" />
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
                  <TableHeader className="sticky right-0 bg-gray-50 dark:bg-gray-800 z-30 shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(0,0,0,0.3)]">
                    <span className="sr-only">Actions</span>
                    <span aria-hidden="true">Actions</span>
                  </TableHeader>
                )}
              </TableRow>
            </TableHead>
            {shouldVirtualize ? (
              // Virtualized rendering - use a wrapper div inside TableBody
              <TableBody striped hover>
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: 0, height: 0 }}>
                    <div
                      style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-500"></div>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement...</span>
                          </div>
                        </div>
                      ) : displayData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center py-8">
                          <div className="text-gray-500 dark:text-gray-400">{emptyMessage}</div>
                        </div>
                      ) : (
                        virtualizer.getVirtualItems().map((virtualRow) => {
                          const row = displayData[virtualRow.index];
                          return (
                            <div
                              key={virtualRow.key}
                              data-index={virtualRow.index}
                              ref={virtualizer.measureElement}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                            >
                              <TableRow
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
                                    className="sticky right-0 bg-white dark:bg-gray-900 z-30 shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                                  >
                                    <div className="relative z-[120]">
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
                                        position="left"
                                      />
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </td>
                </tr>
              </TableBody>
            ) : (
              // Non-virtualized rendering (default)
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
                ) : displayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400">{emptyMessage}</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.map((row, index) => (
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
                          className="sticky right-0 bg-white dark:bg-gray-900 z-30 shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                        >
                          <div className="relative z-[120]">
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
                              position="left"
                            />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Infinite scroll trigger */}
      {infiniteScroll && hasMore && (
        <InfiniteScrollTrigger
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={onLoadMore}
        />
      )}
    </div>
  );
}

// Infinite scroll trigger component
function InfiniteScrollTrigger({
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore?: () => void;
}) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div ref={observerTarget} className="flex justify-center py-4">
      {loadingMore && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 dark:border-primary-500"></div>
          <span className="text-sm">Chargement...</span>
        </div>
      )}
    </div>
  );
}

export default memo(DataTable) as typeof DataTable;

