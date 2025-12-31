/**
 * Hook to get organization logo URL
 * Fetches organization settings and returns the logo URL
 */

import { useState, useEffect } from 'react';
import { settingsAPI } from '@/lib/api/settings';
import { logger } from '@/lib/logger';
import { getApiUrl } from '@/lib/api';

export function useOrganizationLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setIsLoading(true);
        const response = await settingsAPI.getOrganizationSettings();
        const logo = response?.settings?.logo_url;
        
        if (logo) {
          // If logo_url is already a full URL (starts with http:// or https://), use it as is
          if (logo.startsWith('http://') || logo.startsWith('https://')) {
            setLogoUrl(logo);
          } else {
            // If logo_url is a relative path, construct the full URL
            // Try to construct URL from API base URL
            try {
              const apiUrl = getApiUrl();
              // Remove trailing /api if present
              const baseUrl = apiUrl.replace(/\/api$/, '');
              // If logo starts with /, it's an absolute path from the API base
              // Otherwise, it might be a file path that needs to be served via media endpoint
              if (logo.startsWith('/')) {
                setLogoUrl(`${baseUrl}${logo}`);
              } else {
                // Assume it's a media file path, try to serve it via the media endpoint
                setLogoUrl(`${baseUrl}/api/v1/media/${logo}`);
              }
            } catch (error) {
              // If we can't construct the URL, log and use the original value
              logger.warn('Failed to construct logo URL, using original value:', error);
              setLogoUrl(logo);
            }
          }
        } else {
          setLogoUrl(null);
        }
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
