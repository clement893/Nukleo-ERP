/**
 * Hooks Library
 * Main export for reusable hooks
 */

// Form hooks
export { useForm } from './forms/useForm';
export type { UseFormOptions, UseFormReturn, FormField } from './forms/useForm';

// Data hooks
export { usePagination } from './data/usePagination';
export type { UsePaginationOptions, UsePaginationReturn } from './data/usePagination';
export { useFilters } from './data/useFilters';
export type { UseFiltersOptions, UseFiltersReturn, FilterConfig, FilterOperator } from './data/useFilters';

// Permission hooks
export { usePermissions } from './permissions/usePermissions';
export type { UsePermissionsOptions, UsePermissionsReturn, Permission, Role, PermissionConfig } from './permissions/usePermissions';

