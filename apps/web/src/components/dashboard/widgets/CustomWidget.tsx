'use client';

/**
 * Widget : Widget Personnalisé
 * Rendu dynamique des widgets personnalisés créés par l'utilisateur
 */

import { useEffect, useState } from 'react';
import { useWidgetData } from '@/hooks/dashboard/useWidgetData';
import type { WidgetProps } from '@/lib/dashboard/types';
import { customWidgetsAPI, type CustomWidget as CustomWidgetType } from '@/lib/api/custom-widgets';
import { logger } from '@/lib/logger';
import DOMPurify from 'isomorphic-dompurify';

interface CustomWidgetData {
  widget: CustomWidgetType;
  data?: any;
  error?: string;
}

export function CustomWidget({ config, globalFilters }: WidgetProps) {
  const [widgetData, setWidgetData] = useState<CustomWidgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le widget personnalisé depuis l'API
  useEffect(() => {
    const loadWidget = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Le widget_id devrait être dans la config
        const widgetId = config?.widget_id as number | undefined;
        if (!widgetId) {
          throw new Error('Widget ID not found in config');
        }

        const widget = await customWidgetsAPI.get(widgetId);
        
        // Charger les données si nécessaire
        let data = null;
        if (widget.data_source && widget.data_source.type === 'api') {
          try {
            // TODO: Implémenter le fetch de données depuis l'API
            // Pour l'instant, on laisse data = null
          } catch (err) {
            logger.warn('Error fetching widget data', err);
          }
        }

        setWidgetData({ widget, data });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load custom widget';
        setError(errorMessage);
        logger.error('Error loading custom widget', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWidget();
  }, [config?.widget_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !widgetData) {
    return (
      <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">
        <p className="text-sm">{error || 'Failed to load widget'}</p>
      </div>
    );
  }

  const { widget, data } = widgetData;

  // Appliquer les styles personnalisés
  const style: React.CSSProperties = {};
  if (widget.style) {
    if (widget.style.backgroundColor) style.backgroundColor = widget.style.backgroundColor;
    if (widget.style.textColor) style.color = widget.style.textColor;
    if (widget.style.borderColor) style.borderColor = widget.style.borderColor;
    if (widget.style.borderRadius) style.borderRadius = `${widget.style.borderRadius}px`;
    if (widget.style.padding) style.padding = `${widget.style.padding}px`;
    if (widget.style.fontSize) style.fontSize = `${widget.style.fontSize}px`;
    if (widget.style.fontFamily) style.fontFamily = widget.style.fontFamily;
    if (widget.style.borderWidth) style.borderWidth = `${widget.style.borderWidth}px`;
    if (widget.style.boxShadow) style.boxShadow = widget.style.boxShadow;
  }

  // Rendu selon le type de widget
  switch (widget.type) {
    case 'html':
      return (
        <div className="h-full" style={style}>
          {widget.config.html_content && (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(widget.config.html_content),
              }}
            />
          )}
          {widget.config.css_content && (
            <style>{widget.config.css_content}</style>
          )}
        </div>
      );

    case 'text':
      const textContent = widget.config.text_content || '';
      if (widget.config.text_format === 'markdown') {
        // TODO: Implémenter le rendu markdown
        return (
          <div className="h-full overflow-auto" style={style}>
            <div className="prose dark:prose-invert max-w-none">
              {textContent}
            </div>
          </div>
        );
      } else if (widget.config.text_format === 'html') {
        return (
          <div
            className="h-full overflow-auto"
            style={style}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(textContent),
            }}
          />
        );
      } else {
        return (
          <div className="h-full overflow-auto whitespace-pre-wrap" style={style}>
            {textContent}
          </div>
        );
      }

    case 'iframe':
      if (!widget.config.iframe_url) {
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No iframe URL configured</p>
          </div>
        );
      }
      const sandbox = widget.config.iframe_sandbox?.join(' ') || 'allow-scripts allow-same-origin';
      return (
        <div className="h-full" style={style}>
          <iframe
            src={widget.config.iframe_url}
            className="w-full h-full border-0"
            sandbox={sandbox}
            title={widget.name}
          />
        </div>
      );

    case 'api':
      // TODO: Implémenter le rendu avec template
      return (
        <div className="h-full overflow-auto" style={style}>
          <pre className="text-xs p-4">
            {JSON.stringify(data || { message: 'No data available' }, null, 2)}
          </pre>
        </div>
      );

    case 'chart':
      // TODO: Implémenter le rendu de graphique
      return (
        <div className="h-full flex items-center justify-center" style={style}>
          <p className="text-sm text-gray-500">Chart rendering not yet implemented</p>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p className="text-sm">Unknown widget type: {widget.type}</p>
        </div>
      );
  }
}
