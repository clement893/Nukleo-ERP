/**
 * Theme Validator
 * Validates theme configurations for contrast and color format compliance
 */

import { getContrastIssues, ContrastIssue } from './contrast-utils';
import { validateThemeColors, type ColorValidationResult } from './color-validation';

/**
 * Theme validation result
 */
export interface ThemeValidationResult {
  valid: boolean;
  colorFormatErrors: ColorValidationResult['errors'];
  contrastIssues: ContrastIssue[];
  warnings: string[];
}

/**
 * Validate a theme configuration
 * Checks both color format and contrast compliance
 * 
 * @param config Theme configuration object
 * @param options Validation options
 * @returns Validation result with errors and warnings
 */
export function validateThemeConfig(
  config: {
    colors?: Record<string, any>;
    primary_color?: string;
    secondary_color?: string;
    danger_color?: string;
    warning_color?: string;
    info_color?: string;
    success_color?: string;
    typography?: {
      textHeading?: string;
      textSubheading?: string;
      textBody?: string;
      textSecondary?: string;
      textLink?: string;
    };
  },
  options: {
    strictContrast?: boolean; // If true, fails on any contrast issue
    logWarnings?: boolean; // If true, logs warnings for contrast issues
  } = {}
): ThemeValidationResult {
  const { strictContrast = false, logWarnings = true } = options;
  
  // Validate color formats
  const colorValidation = validateThemeColors(config);
  
  // Validate contrasts (only if color formats are valid)
  let contrastIssues: ContrastIssue[] = [];
  if (colorValidation.valid) {
    contrastIssues = getContrastIssues(config);
  }
  
  // Generate warnings
  const warnings: string[] = [];
  
  if (colorValidation.errors.length > 0) {
    warnings.push(
      `Found ${colorValidation.errors.length} color format error(s). Contrast validation skipped.`
    );
  }
  
  if (contrastIssues.length > 0) {
    const failCount = contrastIssues.filter(issue => issue.level === 'fail').length;
    const aaLargeCount = contrastIssues.filter(issue => issue.level === 'AA Large').length;
    
    if (failCount > 0) {
      warnings.push(
        `Found ${failCount} contrast issue(s) that do not meet WCAG requirements.`
      );
    }
    
    if (aaLargeCount > 0) {
      warnings.push(
        `Found ${aaLargeCount} contrast issue(s) that only meet WCAG AA for large text.`
      );
    }
    
    if (logWarnings) {
      contrastIssues.forEach(issue => {
        console.warn(`[Theme Validation] ${issue.message}`);
      });
    }
  }
  
  // Determine if theme is valid
  const valid = colorValidation.valid && 
                (strictContrast ? contrastIssues.length === 0 : 
                 contrastIssues.filter(issue => issue.level === 'fail').length === 0);
  
  return {
    valid,
    colorFormatErrors: colorValidation.errors,
    contrastIssues,
    warnings,
  };
}

/**
 * Get summary of validation issues
 * 
 * @param result Validation result
 * @returns Human-readable summary
 */
export function getValidationSummary(result: ThemeValidationResult): string {
  const parts: string[] = [];
  
  if (result.valid) {
    parts.push('✅ Theme configuration is valid');
  } else {
    parts.push('❌ Theme configuration has issues');
  }
  
  if (result.colorFormatErrors.length > 0) {
    parts.push(`\nColor Format Errors (${result.colorFormatErrors.length}):`);
    result.colorFormatErrors.forEach((error: ColorValidationResult['errors'][0]) => {
      parts.push(`  - ${error.field}: ${error.message}`);
    });
  }
  
  if (result.contrastIssues.length > 0) {
    parts.push(`\nContrast Issues (${result.contrastIssues.length}):`);
    result.contrastIssues.forEach(issue => {
      parts.push(`  - ${issue.element}: ${issue.message} (ratio: ${issue.ratio}:1)`);
    });
  }
  
  if (result.warnings.length > 0) {
    parts.push(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach(warning => {
      parts.push(`  - ${warning}`);
    });
  }
  
  return parts.join('\n');
}

