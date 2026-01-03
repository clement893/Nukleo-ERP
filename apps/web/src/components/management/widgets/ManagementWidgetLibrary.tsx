'use client';

/**
 * Management Widget Library
 * Modal showing available widgets to add
 */

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button, Card } from '@/components/ui';
import { useManagementDashboardStore } from '@/lib/management/store';
import type { ManagementWidgetType, WidgetMetadata } from '@/lib/management/types';
import { Users, Clock, Plane, AlertCircle, Calendar } from 'lucide-react';

interface ManagementWidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

const WIDGET_METADATA: Record<ManagementWidgetType, WidgetMetadata> = {
  'employees-stats': {
    type: 'employees-stats',
    name: 'Statistiques Employés',
    description: 'Affiche le total des employés, les actifs et les nouveaux',
    category: 'statistics',
    defaultSize: { w: 4, h: 2 },
  },
  'time-tracking-summary': {
    type: 'time-tracking-summary',
    name: 'Résumé Suivi du Temps',
    description: 'Vue d\'ensemble des heures travaillées',
    category: 'statistics',
    defaultSize: { w: 4, h: 2 },
  },
  'vacation-overview': {
    type: 'vacation-overview',
    name: 'Vue d\'ensemble Vacances',
    description: 'Statistiques sur les vacances et congés',
    category: 'statistics',
    defaultSize: { w: 4, h: 2 },
  },
  'pending-requests': {
    type: 'pending-requests',
    name: 'Demandes en Attente',
    description: 'Liste des demandes de vacances et dépenses en attente',
    category: 'lists',
    defaultSize: { w: 6, h: 3 },
  },
  'upcoming-vacations': {
    type: 'upcoming-vacations',
    name: 'Vacances à Venir',
    description: 'Calendrier des prochaines vacances approuvées',
    category: 'lists',
    defaultSize: { w: 6, h: 3 },
  },
  'expense-summary': {
    type: 'expense-summary',
    name: 'Résumé Dépenses',
    description: 'Total des dépenses et répartition par catégorie',
    category: 'statistics',
    defaultSize: { w: 4, h: 2 },
  },
  'hours-chart': {
    type: 'hours-chart',
    name: 'Graphique Heures',
    description: 'Graphique des heures travaillées sur une période',
    category: 'charts',
    defaultSize: { w: 6, h: 3 },
  },
  'team-capacity-chart': {
    type: 'team-capacity-chart',
    name: 'Capacité Équipe',
    description: 'Graphique de la capacité et charge des équipes',
    category: 'charts',
    defaultSize: { w: 6, h: 3 },
  },
  'vacation-calendar': {
    type: 'vacation-calendar',
    name: 'Calendrier Vacances',
    description: 'Calendrier mensuel des vacances',
    category: 'calendar',
    defaultSize: { w: 6, h: 4 },
  },
  'time-distribution': {
    type: 'time-distribution',
    name: 'Distribution du Temps',
    description: 'Répartition du temps par projet ou tâche',
    category: 'charts',
    defaultSize: { w: 6, h: 3 },
  },
  'recent-employees': {
    type: 'recent-employees',
    name: 'Employés Récents',
    description: 'Liste des employés récemment ajoutés',
    category: 'lists',
    defaultSize: { w: 4, h: 2 },
  },
  'recent-time-entries': {
    type: 'recent-time-entries',
    name: 'Dernières Entrées',
    description: 'Dernières entrées de temps enregistrées',
    category: 'lists',
    defaultSize: { w: 4, h: 2 },
  },
  'vacation-calendar-view': {
    type: 'vacation-calendar-view',
    name: 'Vue Calendrier',
    description: 'Vue calendrier complète des vacances',
    category: 'calendar',
    defaultSize: { w: 12, h: 4 },
  },
  'team-availability': {
    type: 'team-availability',
    name: 'Disponibilité Équipe',
    description: 'Disponibilité et charge des équipes',
    category: 'calendar',
    defaultSize: { w: 6, h: 3 },
  },
};

const CATEGORY_ICONS = {
  statistics: Users,
  charts: Clock,
  lists: AlertCircle,
  calendar: Calendar,
};

export function ManagementWidgetLibrary({ isOpen, onClose }: ManagementWidgetLibraryProps) {
  const { addWidget, configs, activeConfig } = useManagementDashboardStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const currentConfig = configs.find(c => c.id === activeConfig) || configs[0];
  const usedWidgetTypes = new Set(currentConfig?.layouts.map(w => w.widget_type) || []);

  const categories = ['all', 'statistics', 'charts', 'lists', 'calendar'] as const;
  
  const filteredWidgets = Object.values(WIDGET_METADATA).filter(widget => {
    if (selectedCategory !== 'all' && widget.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleAddWidget = (widgetType: ManagementWidgetType) => {
    const metadata = WIDGET_METADATA[widgetType];
    if (!metadata) return;

    // Find the highest y position to place new widget at the bottom
    const maxY = currentConfig?.layouts.reduce((max, w) => Math.max(max, w.y + w.h), 0) || 0;

    const newWidget = {
      id: `widget-${Date.now()}`,
      widget_type: widgetType,
      x: 0,
      y: maxY,
      w: metadata.defaultSize.w,
      h: metadata.defaultSize.h,
    };

    addWidget(newWidget);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un widget"
      size="xl"
    >
      <div className="space-y-6">
        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => {
            const Icon = category === 'all' ? null : CATEGORY_ICONS[category];
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {Icon && <Icon className="w-4 h-4 mr-2" />}
                {category === 'all' ? 'Tous' : category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            );
          })}
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {filteredWidgets.map((widget) => {
            const Icon = CATEGORY_ICONS[widget.category];
            const isUsed = usedWidgetTypes.has(widget.type);
            
            return (
              <Card
                key={widget.type}
                className={`glass-card p-4 cursor-pointer hover:border-primary-500/40 transition-all ${
                  isUsed ? 'opacity-50' : ''
                }`}
                onClick={() => !isUsed && handleAddWidget(widget.type)}
              >
                <div className="flex items-start gap-3">
                  {Icon && (
                    <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/30">
                      <Icon className="w-5 h-5 text-primary-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {widget.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {widget.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {widget.defaultSize.w} × {widget.defaultSize.h}
                      </span>
                      {isUsed && (
                        <span className="text-xs text-warning-500">
                          Déjà ajouté
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
