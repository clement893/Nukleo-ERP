/**
 * OpportunityActivities Component
 * 
 * Composant pour afficher l'historique des activités d'une opportunité
 * dans une timeline chronologique avec groupement par date.
 */

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activitiesAPI, Activity } from '@/lib/api/activities';
import { Opportunity } from '@/lib/api/opportunities';
import { Card, Badge, Button } from '@/components/ui';
import { 
  Clock, 
  FileText, 
  Settings, 
  Tag, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  User,
  Users,
  Sparkles,
  Filter,
  X
} from 'lucide-react';

export interface OpportunityActivitiesProps {
  opportunityId: string;
  opportunity: Opportunity;
}

interface ActivityItem extends Activity {
  user_name?: string;
  user_email?: string;
}

type ActivityType = 'modification' | 'creation' | 'note' | 'document' | 'submission' | 'quote' | 'other';

const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return 'il y a quelques secondes';
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `il y a ${mins} minute${mins > 1 ? 's' : ''}`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateGroup = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  
  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (activityDate.getTime() === today.getTime()) {
    return 'Aujourd\'hui';
  }
  if (activityDate.getTime() === yesterday.getTime()) {
    return 'Hier';
  }
  if (activityDate >= thisWeek) {
    return 'Cette semaine';
  }
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getActivityType = (activity: Activity): ActivityType => {
  const action = activity.action.toLowerCase();
  const entityType = activity.entity_type?.toLowerCase() || '';
  
  if (action.includes('create') && entityType.includes('opportunit')) {
    return 'creation';
  }
  if (action.includes('update') || action.includes('modif')) {
    return 'modification';
  }
  if (entityType.includes('note')) {
    return 'note';
  }
  if (entityType.includes('document')) {
    return 'document';
  }
  if (entityType.includes('submission')) {
    return 'submission';
  }
  if (entityType.includes('quote')) {
    return 'quote';
  }
  
  return 'other';
};

const getActivityIcon = (type: ActivityType) => {
  const iconClass = 'w-5 h-5';
  
  switch (type) {
    case 'creation':
      return <Sparkles className={`${iconClass} text-green-500`} />;
    case 'modification':
      return <Settings className={`${iconClass} text-blue-500`} />;
    case 'note':
      return <FileText className={`${iconClass} text-purple-500`} />;
    case 'document':
      return <FileText className={`${iconClass} text-orange-500`} />;
    case 'submission':
      return <FileText className={`${iconClass} text-indigo-500`} />;
    case 'quote':
      return <DollarSign className={`${iconClass} text-green-600`} />;
    default:
      return <Clock className={`${iconClass} text-gray-500`} />;
  }
};

const getActivityTitle = (activity: Activity, type: ActivityType): string => {
  const action = activity.action.toLowerCase();
  
  if (type === 'creation') {
    return 'Opportunité créée';
  }
  if (type === 'modification') {
    if (action.includes('stage') || action.includes('étape')) {
      return 'Stage modifié';
    }
    if (action.includes('montant') || action.includes('amount')) {
      return 'Montant modifié';
    }
    if (action.includes('probabilité') || action.includes('probability')) {
      return 'Probabilité modifiée';
    }
    if (action.includes('date') || action.includes('close')) {
      return 'Date de clôture modifiée';
    }
    if (action.includes('assign') || action.includes('assigné')) {
      return 'Assignation modifiée';
    }
    return 'Opportunité modifiée';
  }
  if (type === 'note') {
    return 'Note ajoutée';
  }
  if (type === 'document') {
    return 'Document ajouté';
  }
  if (type === 'submission') {
    return 'Soumission créée';
  }
  if (type === 'quote') {
    return 'Devis créé';
  }
  
  return activity.action || 'Activité';
};

const getActivityDescription = (activity: Activity, type: ActivityType, opportunity: Opportunity): string => {
  const metadata = activity.event_metadata || {};
  
  if (type === 'modification') {
    const action = activity.action.toLowerCase();
    
    if (action.includes('stage') || action.includes('étape')) {
      const oldStage = metadata.old_value as string;
      const newStage = metadata.new_value as string || opportunity.stage_name;
      if (oldStage && newStage) {
        return `${oldStage} → ${newStage}`;
      }
      return newStage || 'Stage modifié';
    }
    if (action.includes('montant') || action.includes('amount')) {
      const oldAmount = metadata.old_value as number;
      const newAmount = metadata.new_value as number || opportunity.amount;
      if (oldAmount !== undefined && newAmount !== undefined) {
        const formatCurrency = (amount: number) => 
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
        return `${formatCurrency(oldAmount)} → ${formatCurrency(newAmount)}`;
      }
      return newAmount ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(newAmount) : 'Montant modifié';
    }
    if (action.includes('probabilité') || action.includes('probability')) {
      const oldProb = metadata.old_value as number;
      const newProb = metadata.new_value as number || opportunity.probability;
      if (oldProb !== undefined && newProb !== undefined) {
        return `${oldProb}% → ${newProb}%`;
      }
      return newProb ? `${newProb}%` : 'Probabilité modifiée';
    }
  }
  
  if (metadata.description) {
    return String(metadata.description);
  }
  
  if (metadata.note) {
    return String(metadata.note).substring(0, 100);
  }
  
  return activity.action || 'Activité enregistrée';
};

const groupActivitiesByDate = (activities: ActivityItem[]): Record<string, ActivityItem[]> => {
  const groups: Record<string, ActivityItem[]> = {};
  
  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const dateKey = formatDateGroup(date);
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });
  
  // Sort activities within each group (newest first)
  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });
  
  return groups;
};

export function OpportunityActivities({ opportunityId, opportunity }: OpportunityActivitiesProps) {
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  
  // Fetch activities
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['opportunity-activities', opportunityId],
    queryFn: () => activitiesAPI.getTimeline({
      entity_type: 'opportunity',
      entity_id: opportunityId,
      limit: 100,
    }),
    staleTime: 1000 * 60, // 1 minute
  });

  // Add creation activity if opportunity exists and not already in activities
  const allActivities = useMemo(() => {
    const activityList: ActivityItem[] = [...activities];
    
    // Check if creation activity already exists
    const hasCreationActivity = activities.some(
      activity => activity.action.toLowerCase().includes('create') && 
      activity.entity_type?.toLowerCase().includes('opportunit')
    );
    
    // Add creation activity if it doesn't exist
    if (!hasCreationActivity && opportunity.created_at) {
      activityList.push({
        id: -1,
        action: 'create',
        entity_type: 'opportunity',
        entity_id: opportunityId,
        user_id: 0,
        timestamp: opportunity.created_at,
        event_metadata: {
          description: `Opportunité "${opportunity.name}" créée`,
        },
      });
    }
    
    return activityList.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [activities, opportunity, opportunityId]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (filterType === 'all') return allActivities;
    return allActivities.filter(activity => getActivityType(activity) === filterType);
  }, [allActivities, filterType]);

  // Group by date
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(filteredActivities);
  }, [filteredActivities]);

  const dateKeys = Object.keys(groupedActivities).sort((a, b) => {
    // Sort: Aujourd'hui first, then Hier, then by date
    if (a === 'Aujourd\'hui') return -1;
    if (b === 'Aujourd\'hui') return 1;
    if (a === 'Hier') return -1;
    if (b === 'Hier') return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (isLoading) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-center py-12">
          <Clock className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p>Erreur lors du chargement des activités.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Button
          size="sm"
          variant={filterType === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterType('all')}
        >
          Toutes
        </Button>
        <Button
          size="sm"
          variant={filterType === 'creation' ? 'default' : 'outline'}
          onClick={() => setFilterType('creation')}
        >
          Création
        </Button>
        <Button
          size="sm"
          variant={filterType === 'modification' ? 'default' : 'outline'}
          onClick={() => setFilterType('modification')}
        >
          Modifications
        </Button>
        <Button
          size="sm"
          variant={filterType === 'note' ? 'default' : 'outline'}
          onClick={() => setFilterType('note')}
        >
          Notes
        </Button>
        <Button
          size="sm"
          variant={filterType === 'document' ? 'default' : 'outline'}
          onClick={() => setFilterType('document')}
        >
          Documents
        </Button>
      </div>

      {/* Timeline */}
      {dateKeys.length === 0 ? (
        <Card className="glass-card p-6">
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune activité enregistrée pour cette opportunité.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateKey) => (
            <div key={dateKey} className="space-y-3">
              <h4 className="text-sm font-semibold text-primary-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {dateKey}
              </h4>
              
              <div className="space-y-3 ml-6 border-l-2 border-border pl-6">
                {groupedActivities[dateKey].map((activity) => {
                  const type = getActivityType(activity);
                  const title = getActivityTitle(activity, type);
                  const description = getActivityDescription(activity, type, opportunity);
                  
                  return (
                    <Card key={activity.id} className="glass-card p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-foreground">{title}</h5>
                            <Badge variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                            {activity.user_id > 0 && (
                              <>
                                <span>•</span>
                                <User className="w-3 h-3" />
                                <span>Utilisateur #{activity.user_id}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
