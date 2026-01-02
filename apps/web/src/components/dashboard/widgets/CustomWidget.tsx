'use client';

/**
 * Widget : Widget Personnalisé
 * Rendu dynamique des widgets personnalisés créés par l'utilisateur
 */

import { useEffect, useState, useMemo } from 'react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { customWidgetsAPI, type CustomWidget as CustomWidgetType } from '@/lib/api/custom-widgets';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import DOMPurify from 'isomorphic-dompurify';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CustomWidgetData {
  widget: CustomWidgetType;
  data?: any;
  error?: string;
}

// Fonction pour charger les données depuis l'API
async function fetchWidgetData(dataSource: any) {
    if (!dataSource.endpoint) {
      throw new Error('API endpoint not specified');
    }

    const method = dataSource.method || 'GET';
    const headers = dataSource.headers || {};
    const params = dataSource.params || {};
    const body = dataSource.body;

    let response;
    if (method === 'GET') {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const url = dataSource.endpoint + (queryParams.toString() ? `?${queryParams.toString()}` : '');
      response = await apiClient.get(url, { headers });
    } else if (method === 'POST') {
      response = await apiClient.post(dataSource.endpoint, body, { headers, params });
    } else if (method === 'PUT') {
      response = await apiClient.put(dataSource.endpoint, body, { headers, params });
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    let result = response.data;

    // Extraire les données selon data_path si fourni
    if (dataSource.data_path && result) {
      const pathParts = dataSource.data_path.split('.');
      for (const part of pathParts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          result = null;
          break;
        }
      }
    }

    return result;
}

export function CustomWidget({ config, globalFilters }: WidgetProps) {
  const [widgetData, setWidgetData] = useState<CustomWidgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[] | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

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
        
        // Charger les données si nécessaire (pour API et Chart)
        let data = null;
        if (widget.data_source && widget.data_source.type === 'api') {
          try {
            data = await fetchWidgetData(widget.data_source);
            
            // Appliquer la transformation si fournie
            if (widget.data_source.transform && data) {
              try {
                // Créer une fonction de transformation sécurisée
                const transformFn = new Function('data', widget.data_source.transform);
                data = transformFn(data);
              } catch (transformErr) {
                logger.warn('Error applying data transformation', transformErr);
              }
            }
          } catch (err) {
            logger.warn('Error fetching widget data', err);
          }
        }

        setWidgetData({ widget, data });

        // Pour les widgets chart, charger les données séparément si nécessaire
        if (widget.type === 'chart' && widget.data_source && widget.data_source.type === 'api' && !data) {
          loadChartData(widget.data_source);
        } else if (widget.type === 'chart' && data) {
          // Utiliser les données déjà chargées
          if (Array.isArray(data)) {
            setChartData(data);
          } else if (data && typeof data === 'object') {
            const arrayData = data.data || data.items || [data];
            setChartData(Array.isArray(arrayData) ? arrayData : [arrayData]);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load custom widget';
        setError(errorMessage);
        logger.error('Error loading custom widget', err);
      } finally {
        setIsLoading(false);
      }
    };

    const loadChartData = async (dataSource: any) => {
      try {
        setChartLoading(true);
        let fetchedData = await fetchWidgetData(dataSource);
        
        // Appliquer la transformation si fournie
        if (dataSource.transform && fetchedData) {
          try {
            const transformFn = new Function('data', dataSource.transform);
            fetchedData = transformFn(fetchedData);
          } catch (transformErr) {
            logger.warn('Error applying data transformation', transformErr);
          }
        }
        
        // S'assurer que les données sont un tableau
        if (Array.isArray(fetchedData)) {
          setChartData(fetchedData);
        } else if (fetchedData && typeof fetchedData === 'object') {
          const arrayData = fetchedData.data || fetchedData.items || [fetchedData];
          setChartData(Array.isArray(arrayData) ? arrayData : [arrayData]);
        } else {
          setChartData([]);
        }
      } catch (err) {
        logger.warn('Error fetching chart data', err);
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    loadWidget();

    // Rafraîchissement automatique si configuré
    const refreshInterval = config?.refresh_interval;
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadWidget();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [config?.widget_id, config?.refresh_interval]);

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
        // Rendu markdown simple (sans bibliothèque externe)
        const markdownToHtml = (md: string): string => {
          let html = md;
          // Headers
          html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
          html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
          html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
          // Bold
          html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
          html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
          // Italic
          html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
          html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
          // Links
          html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
          // Line breaks
          html = html.replace(/\n\n/gim, '</p><p>');
          html = html.replace(/\n/gim, '<br>');
          // Lists
          html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
          html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
          html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
          // Code blocks
          html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
          // Wrap in paragraph if not already wrapped
          if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
          }
          return html;
        };
        
        const htmlContent = markdownToHtml(textContent);
        return (
          <div className="h-full overflow-auto" style={style}>
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(htmlContent),
              }}
            />
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
          <div className="flex items-center justify-center h-full text-gray-500" style={style}>
            <p className="text-sm">Aucune URL iframe configurée</p>
          </div>
        );
      }
      
      // Configuration sandbox sécurisée par défaut
      const defaultSandbox = [
        'allow-scripts',
        'allow-same-origin',
        'allow-forms',
        'allow-popups',
        'allow-popups-to-escape-sandbox',
      ];
      const sandbox = widget.config.iframe_sandbox?.length 
        ? widget.config.iframe_sandbox.join(' ')
        : defaultSandbox.join(' ');
      
      return (
        <div className="h-full w-full" style={style}>
          <iframe
            src={widget.config.iframe_url}
            className="w-full h-full border-0 rounded-lg"
            sandbox={sandbox}
            title={widget.name}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );

    case 'api':
      // Rendu avec template si fourni, sinon JSON brut
      if (widget.config.template && data) {
        try {
          // Template simple avec remplacement de variables
          let html = widget.config.template;
          
          // Remplacer {{variable}} par les valeurs
          if (Array.isArray(data)) {
            // Si data est un tableau, itérer sur les éléments
            const items = data.map((item: any) => {
              let itemHtml = html;
              Object.keys(item).forEach((key) => {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                itemHtml = itemHtml.replace(regex, String(item[key] || ''));
              });
              return itemHtml;
            }).join('');
            html = items;
          } else if (typeof data === 'object' && data !== null) {
            // Si data est un objet, remplacer les variables
            Object.keys(data).forEach((key) => {
              const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
              html = html.replace(regex, String(data[key] || ''));
            });
          }
          
          return (
            <div
              className="h-full overflow-auto"
              style={style}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(html),
              }}
            />
          );
        } catch (err) {
          logger.error('Error rendering template', err);
          return (
            <div className="h-full overflow-auto p-4" style={style}>
              <p className="text-red-600 dark:text-red-400 text-sm">
                Erreur lors du rendu du template
              </p>
              <pre className="text-xs mt-2">
                {JSON.stringify(data || { message: 'No data available' }, null, 2)}
              </pre>
            </div>
          );
        }
      }
      
      // Fallback: afficher les données en JSON
      return (
        <div className="h-full overflow-auto" style={style}>
          <pre className="text-xs p-4">
            {JSON.stringify(data || { message: 'No data available' }, null, 2)}
          </pre>
        </div>
      );

    case 'chart':
      // Rendu de graphique avec Recharts
      if (chartLoading) {
        return (
          <div className="h-full flex items-center justify-center" style={style}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        );
      }

      // Utiliser chartData si disponible, sinon data
      const dataToUse = chartData || (Array.isArray(data) ? data : []);
      
      if (!dataToUse || !Array.isArray(dataToUse) || dataToUse.length === 0) {
        return (
          <div className="h-full flex items-center justify-center" style={style}>
            <p className="text-sm text-gray-500">Aucune donnée disponible</p>
          </div>
        );
      }

      const chartType = widget.config.chart_type || 'line';
      const chartConfig = widget.config.chart_config || {};
      const xKey = chartConfig.x_axis || 'x' || 'name' || 'month' || 'date';
      const yKey = chartConfig.y_axis || 'y' || 'value';

      // Préparer les données pour le graphique
      const preparedChartData = useMemo(() => {
        if (!Array.isArray(dataToUse)) return [];
        return dataToUse.map((item: any) => ({
          ...item,
          [xKey]: item[xKey] || item.name || item.month || item.date || '',
          [yKey]: item[yKey] !== undefined ? item[yKey] : item.value || item.count || 0,
        }));
      }, [dataToUse, xKey, yKey]);

      // Couleurs par défaut
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

      return (
        <div className="h-full w-full p-4" style={style}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' && (
              <LineChart data={preparedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-30" />
                <XAxis dataKey={xKey} stroke="currentColor" className="text-xs" />
                <YAxis stroke="currentColor" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={yKey}
                  stroke={colors[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
            {chartType === 'bar' && (
              <BarChart data={preparedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-30" />
                <XAxis dataKey={xKey} stroke="currentColor" className="text-xs" />
                <YAxis stroke="currentColor" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey={yKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
            {chartType === 'area' && (
              <AreaChart data={preparedChartData}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-30" />
                <XAxis dataKey={xKey} stroke="currentColor" className="text-xs" />
                <YAxis stroke="currentColor" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={yKey}
                  stroke={colors[0]}
                  strokeWidth={2}
                  fill="url(#colorGradient)"
                />
              </AreaChart>
            )}
            {chartType === 'pie' && (
              <PieChart>
                <Pie
                  data={preparedChartData}
                  dataKey={yKey}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {preparedChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
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
