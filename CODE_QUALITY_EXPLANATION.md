# Code Quality Issues Explained

This document explains three common code quality issues found in the codebase and how to address them.

## 1. ⚠️ Components Could Benefit from Further Decomposition (Large Component Files)

### What It Means

**Large component files** are React components that contain too much code (typically 300+ lines) and handle multiple responsibilities. This makes them:
- Hard to understand and maintain
- Difficult to test
- Prone to bugs
- Hard to reuse parts independently

### Example from Your Codebase

**`DataTable.tsx` (336 lines)** - This component does too many things:

```tsx
// Current: One large component handling everything
function DataTable<T>({ data, columns, ... }) {
  // 1. State management (5+ useState hooks)
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  // ... more state

  // 2. Data filtering logic (50+ lines)
  const filteredData = useMemo(() => {
    // Complex filtering logic
  }, [data, searchTerm, filters, ...]);

  // 3. Data sorting logic (20+ lines)
  // 4. Pagination logic (10+ lines)
  // 5. Search UI rendering (30+ lines)
  // 6. Filter UI rendering (40+ lines)
  // 7. Table rendering (50+ lines)
  // 8. Pagination UI rendering (20+ lines)

  return (
    <div>
      {/* Search and Filters */}
      {/* Table */}
      {/* Pagination */}
    </div>
  );
}
```

### Why It's a Problem

1. **Hard to Test**: Testing requires setting up all dependencies
2. **Hard to Maintain**: Changes to filtering affect the entire component
3. **Hard to Reuse**: Can't reuse search logic without the table
4. **Performance**: Re-renders entire component when only one part changes

### Solution: Decompose into Smaller Components

```tsx
// ✅ Better: Separate concerns into smaller components

// 1. Extract search logic into a hook
function useTableSearch<T>(data: T[], columns: Column<T>[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredData = useMemo(() => {
    // Search logic here
  }, [data, searchTerm, columns]);
  return { searchTerm, setSearchTerm, filteredData };
}

// 2. Extract filtering into a hook
function useTableFilters<T>(data: T[], columns: Column<T>[]) {
  // Filter logic here
}

// 3. Extract sorting into a hook
function useTableSort<T>(data: T[]) {
  // Sort logic here
}

// 4. Create separate UI components
function TableSearchBar({ searchTerm, onSearchChange }) {
  // Just the search UI
}

function TableFilters({ filters, onFilterChange }) {
  // Just the filter UI
}

function TableBody({ data, columns, onRowClick }) {
  // Just the table body
}

// 5. Main component becomes much simpler
function DataTable<T>({ data, columns, ... }) {
  const { filteredData, searchTerm, setSearchTerm } = useTableSearch(data, columns);
  const { sortedData, sortColumn, handleSort } = useTableSort(filteredData);
  const { paginatedData, currentPage, setCurrentPage } = usePagination(sortedData, pageSize);

  return (
    <div>
      <TableSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <TableFilters />
      <TableBody data={paginatedData} columns={columns} />
      <TablePagination />
    </div>
  );
}
```

### Benefits

- ✅ Each piece can be tested independently
- ✅ Search logic can be reused in other components
- ✅ Changes to filtering don't affect table rendering
- ✅ Better performance (only re-renders what changed)

---

## 2. ⚠️ Consider Adding More Abstraction Layers for Complex Business Logic

### What It Means

**Complex business logic** refers to domain-specific rules and calculations that are currently embedded directly in components. This makes the code:
- Hard to test business rules independently
- Difficult to reuse logic across components
- Prone to bugs when logic is duplicated
- Hard to change business rules without touching UI

### Example from Your Codebase

**`ErrorTrackingDashboard.tsx`** - Business logic mixed with UI:

```tsx
// ❌ Current: Business logic inside component
export default function ErrorTrackingDashboard() {
  const [stats, setStats] = useState<ErrorStats>({...});

  useEffect(() => {
    const fetchErrorData = async () => {
      // Business logic: Calculate error statistics
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const errorsLast24h = errors.filter(
        (e) => new Date(e.timestamp) > last24h
      ).length;
      const errorsLast7d = errors.filter(
        (e) => new Date(e.timestamp) > last7d
      ).length;
      const criticalErrors = errors.filter((e) => e.level === 'error').length;
      // ... more calculations

      setStats({
        totalErrors: errors.length,
        errorsLast24h,
        errorsLast7d,
        criticalErrors,
        warningErrors,
      });
    };
  }, []);

  // More business logic: Level color mapping
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      // ...
    }
  };

  return (
    // UI rendering
  );
}
```

### Why It's a Problem

1. **Can't Test Logic Separately**: Must render component to test calculations
2. **Logic Duplication**: Same calculations might exist in other components
3. **Hard to Change**: Business rules scattered across components
4. **Tight Coupling**: UI and business logic are inseparable

### Solution: Create Abstraction Layers

```tsx
// ✅ Better: Extract business logic into services/hooks

// 1. Create a service for error statistics
// services/errorStatisticsService.ts
export class ErrorStatisticsService {
  static calculateStats(errors: Error[]): ErrorStats {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalErrors: errors.length,
      errorsLast24h: this.countErrorsInPeriod(errors, last24h, now),
      errorsLast7d: this.countErrorsInPeriod(errors, last7d, now),
      criticalErrors: this.countByLevel(errors, 'error'),
      warningErrors: this.countByLevel(errors, 'warning'),
    };
  }

  private static countErrorsInPeriod(
    errors: Error[],
    start: Date,
    end: Date
  ): number {
    return errors.filter(
      (e) => new Date(e.timestamp) >= start && new Date(e.timestamp) <= end
    ).length;
  }

  private static countByLevel(errors: Error[], level: string): number {
    return errors.filter((e) => e.level === level).length;
  }
}

// 2. Create a utility for error level mapping
// utils/errorLevelUtils.ts
export const ERROR_LEVEL_CONFIG = {
  error: { color: 'error', icon: XCircle },
  warning: { color: 'warning', icon: AlertTriangle },
  info: { color: 'info', icon: AlertCircle },
} as const;

export function getErrorLevelConfig(level: string) {
  return ERROR_LEVEL_CONFIG[level] || ERROR_LEVEL_CONFIG.info;
}

// 3. Create a custom hook for error data
// hooks/useErrorTracking.ts
export function useErrorTracking() {
  const [errors, setErrors] = useState<Error[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch logic here
    const fetchedErrors = fetchErrors();
    setErrors(fetchedErrors);
    setIsLoading(false);
  }, []);

  const stats = useMemo(
    () => ErrorStatisticsService.calculateStats(errors),
    [errors]
  );

  return { errors, stats, isLoading };
}

// 4. Component becomes much simpler
export default function ErrorTrackingDashboard() {
  const { errors, stats, isLoading } = useErrorTracking();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <ErrorStatsCards stats={stats} />
      <ErrorList errors={errors} />
    </div>
  );
}
```

### Benefits

- ✅ Business logic can be tested independently
- ✅ Logic can be reused across multiple components
- ✅ Easy to change business rules in one place
- ✅ Components focus only on UI rendering

---

## 3. ⚠️ Some Code Duplication in Similar Components

### What It Means

**Code duplication** occurs when the same or very similar code appears in multiple places. This leads to:
- Bugs fixed in one place but not others
- Inconsistent behavior across components
- More code to maintain
- Higher risk of introducing errors

### Example from Your Codebase

**`DataTable.tsx` and `DataTableEnhanced.tsx`** - Duplicated logic:

```tsx
// ❌ DataTable.tsx - Has filtering logic
function DataTable<T>({ data, columns, ... }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const filteredData = useMemo(() => {
    let result = [...data];
    
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
    return result;
  }, [data, filters, columns]);
}

// ❌ DataTableEnhanced.tsx - Has SAME filtering logic
function DataTableEnhanced<T>({ data, columns, ... }) {
  // ... same filtering logic duplicated
  // ... same sorting logic duplicated
  // ... same pagination logic duplicated
}
```

### Why It's a Problem

1. **Bug Fixes**: Fix a bug in `DataTable`, forget to fix in `DataTableEnhanced`
2. **Inconsistency**: Filtering might work differently in each component
3. **Maintenance**: Changes must be made in multiple places
4. **Code Bloat**: More code than necessary

### Solution: Extract Shared Logic

```tsx
// ✅ Better: Extract shared logic into reusable hooks

// hooks/useTableData.ts - Shared table logic
export function useTableData<T>(
  data: T[],
  columns: Column<T>[],
  options: {
    searchable?: boolean;
    filterable?: boolean;
    sortable?: boolean;
  }
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Shared filtering logic
  const filteredData = useMemo(() => {
    let result = [...data];
    
    // Apply search
    if (options.searchable && searchTerm) {
      result = applySearch(result, columns, searchTerm);
    }
    
    // Apply filters
    if (options.filterable) {
      result = applyFilters(result, columns, filters);
    }
    
    // Apply sorting
    if (options.sortable && sortColumn) {
      result = applySorting(result, sortColumn, sortDirection);
    }
    
    return result;
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns]);

  return {
    filteredData,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
  };
}

// ✅ DataTable.tsx - Uses shared hook
function DataTable<T>({ data, columns, ... }) {
  const {
    filteredData,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    // ...
  } = useTableData(data, columns, { searchable, filterable, sortable });

  // Component only handles UI rendering
  return (
    <div>
      <TableSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <TableBody data={filteredData} columns={columns} />
    </div>
  );
}

// ✅ DataTableEnhanced.tsx - Uses same shared hook
function DataTableEnhanced<T>({ data, columns, ... }) {
  const {
    filteredData,
    searchTerm,
    setSearchTerm,
    // ...
  } = useTableData(data, columns, { searchable, filterable, sortable });

  // Only adds enhanced features (bulk actions, export, etc.)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  return (
    <div>
      <TableSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <BulkActionBar selectedRows={selectedRows} />
      <TableBody data={filteredData} columns={columns} />
    </div>
  );
}
```

### Benefits

- ✅ Single source of truth for shared logic
- ✅ Bug fixes apply everywhere automatically
- ✅ Consistent behavior across components
- ✅ Less code to maintain

---

## Summary

### Best Practices

1. **Component Decomposition**
   - Keep components under 200-300 lines
   - Extract reusable hooks for logic
   - Create smaller UI components for complex sections

2. **Abstraction Layers**
   - Move business logic to services/utilities
   - Create custom hooks for data fetching/processing
   - Keep components focused on UI rendering

3. **Eliminate Duplication**
   - Extract shared logic into reusable hooks
   - Create utility functions for common operations
   - Use composition over duplication

### Quick Checklist

When reviewing a component, ask:
- [ ] Is this component over 300 lines? → Consider decomposition
- [ ] Does it contain business logic? → Extract to service/hook
- [ ] Is similar code in other components? → Extract shared logic
- [ ] Can parts be tested independently? → If not, decompose further
- [ ] Can parts be reused elsewhere? → Extract to hooks/utilities

### Example Refactoring Priority

1. **High Priority**: Components with business logic (ErrorTrackingDashboard)
2. **Medium Priority**: Large components (DataTable, FormBuilder)
3. **Low Priority**: Components with minor duplication

---

## Next Steps

1. Identify large components (>300 lines) and plan decomposition
2. Extract business logic from components into services/hooks
3. Find duplicated code patterns and create shared utilities
4. Gradually refactor, starting with most-used components

