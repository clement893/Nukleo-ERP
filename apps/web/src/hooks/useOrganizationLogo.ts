/**
 * Hook to get organization logo URL
 * Fetches organization settings and returns the logo URL
 */

import { useState, useEffect } from 'react';
import { settingsAPI } from '@/lib/api/settings';
import { logger } from '@/lib/logger';

export function useOrganizationLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setIsLoading(true);
        const response = await settingsAPI.getOrganizationSettings();
        const logo = response?.settings?.logo_url;
        setLogoUrl(logo || null);
      } catch (error) {
        // Silently fail - logo is optional
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Failed to fetch organization logo:', error);
        }
        setLogoUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogo();
  }, []);

  return { logoUrl, isLoading };
}
