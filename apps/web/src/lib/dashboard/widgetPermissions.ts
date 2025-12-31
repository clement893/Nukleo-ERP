/**
 * Widget Permissions Mapping
 * Maps widget categories to employee portal modules
 */

import type { WidgetCategory } from './types';
import { widgetRegistry } from './widgetRegistry';
import type { WidgetType } from './types';

/**
 * Map widget categories to employee portal modules
 */
export const WIDGET_CATEGORY_TO_MODULE: Record<WidgetCategory, string> = {
  commercial: 'commercial',
  projects: 'projects',
  finances: 'finances',
  performance: 'performance', // No specific module, accessible to all
  team: 'team', // No specific module, accessible to all
  system: 'system', // No specific module, accessible to all
};

/**
 * Check if a widget category is accessible based on module permissions
 */
export function canAccessWidgetCategory(
  category: WidgetCategory,
  hasModuleAccess: (module: string) => boolean
): boolean {
  const module = WIDGET_CATEGORY_TO_MODULE[category];
  
  // System, performance, and team widgets are always accessible
  if (category === 'system' || category === 'performance' || category === 'team') {
    return true;
  }
  
  // Check module access for other categories
  return hasModuleAccess(module);
}

/**
 * Get accessible widget types based on permissions
 */
export function getAccessibleWidgetTypes(
  hasModuleAccess: (module: string) => boolean
): WidgetType[] {
  return Object.values(widgetRegistry)
    .filter(widget => canAccessWidgetCategory(widget.category, hasModuleAccess))
    .map(widget => widget.id);
}

/**
 * Filter widget registry based on permissions
 */
export function getFilteredWidgetRegistry(
  hasModuleAccess: (module: string) => boolean
): Partial<Record<WidgetType, typeof widgetRegistry[WidgetType]>> {
  const accessibleTypes = getAccessibleWidgetTypes(hasModuleAccess);
  const filtered: Partial<Record<WidgetType, typeof widgetRegistry[WidgetType]>> = {};
  
  accessibleTypes.forEach(type => {
    filtered[type] = widgetRegistry[type];
  });
  
  return filtered;
}
