/**
 * Widget Permissions Mapping
 * Maps widget categories to employee portal modules
 */

import type { WidgetCategory, WidgetDefinition } from './types';
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
  hasModuleAccess: (module: string) => boolean,
  registry: Record<WidgetType, WidgetDefinition> = widgetRegistry
): WidgetType[] {
  return Object.values(registry)
    .filter(widget => canAccessWidgetCategory(widget.category, hasModuleAccess))
    .map(widget => widget.id);
}

/**
 * Filter widget registry based on permissions
 */
export function getFilteredWidgetRegistry(
  hasModuleAccess: (module: string) => boolean,
  registry: Record<WidgetType, WidgetDefinition> = widgetRegistry
): Partial<Record<WidgetType, WidgetDefinition>> {
  const accessibleTypes = getAccessibleWidgetTypes(hasModuleAccess, registry);
  const filtered: Partial<Record<WidgetType, WidgetDefinition>> = {};
  
  accessibleTypes.forEach(type => {
    if (registry[type]) {
      filtered[type] = registry[type];
    }
  });
  
  return filtered;
}
