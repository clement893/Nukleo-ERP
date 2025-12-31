'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { handleApiError } from '@/lib/errors/api';
import { Calendar, Clock, User, Briefcase, Building, ChevronDown, ChevronUp } from 'lucide-react';
import { groupByWeek, groupByMonth, groupByProject, groupByClient, formatDuration, type GroupedTimeEntry } from '@/lib/utils/timesheet';

export default function TimesheetPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    project_id: '',
    client_id: '',
  });
  const [groupBy, setGroupBy] = useState<'week' | 'month' | 'project' | 'client' | 'none'>('week');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      loadEntries();
    }
  }, [user?.id, filters]);

  const loadEntries = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const params: {
        user_id?: number;
        start_date?: string;
        end_date?: string;
        project_id?: number;
        client_id?: number;
      } = {
        user_id: parseInt(user.id),
      };

      if (filters.start_date) {
        params.start_date = new Date(filters.start_date).toISOString();
      }
      if (filters.end_date) {
        params.end_date = new Date(filters.end_date).toISOString();
      }
      if (filters.project_id) {
        params.project_id = parseInt(filters.project_id);
      }
      if (filters.client_id) {
        params.client_id = parseInt(filters.client_id);
      }

      const data = await timeEntriesAPI.list(params);
      setEntries(data || []);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement de la feuille de temps');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);

  // Get unique projects and clients for filters
  const uniqueProjects = Array.from(new Set(entries.map(e => e.project_name).filter(Boolean)));
  const uniqueClients = Array.from(new Set(entries.map(e => e.client_name).filter(Boolean)));

  // Group entries based on selected grouping
  let groupedEntries: GroupedTimeEntry[] = [];
  if (groupBy === 'week') {
    groupedEntries = groupByWeek(entries);
  } else if (groupBy === 'month') {
    groupedEntries = groupByMonth(entries);
  } else if (groupBy === 'project') {
    groupedEntries = groupByProject(entries);
  } else if (groupBy === 'client') {
    groupedEntries = groupByClient(entries);
  } else {
    groupedEntries = [{
      key: 'all',
      label: 'Toutes les entrées',
      entries,
      totalDuration,
    }];
  }

  if (loading && entries.length === 0) {
    return (
      <div className="py-8">
        <Container>
          <Card className="glass-card">
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Feuille de temps</h1>
          <p className="text-muted-foreground">
            Consultez et gérez vos entrées de temps
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Summary Card */}
        <Card className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Temps total</p>
              <p className="text-3xl font-bold text-foreground">{formatDuration(totalDuration)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">{entries.length} entrées</Badge>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Filtres et regroupement</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <Select
                label="Regrouper par"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'week' | 'month' | 'project' | 'client' | 'none')}
                options={[
                  { value: 'week', label: 'Semaine' },
                  { value: 'month', label: 'Mois' },
                  { value: 'project', label: 'Projet' },
                  { value: 'client', label: 'Client' },
                  { value: 'none', label: 'Aucun' },
                ]}
              />
            </div>
            <div>
              <Input
                type="date"
                label="Date de début"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            <div>
              <Input
                type="date"
                label="Date de fin"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
            <div>
              <Select
                label="Projet"
                value={filters.project_id || ''}
                onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
                options={[
                  { value: '', label: 'Tous les projets' },
                  ...uniqueProjects.map((project) => ({
                    value: project || '',
                    label: project || '',
                  })),
                ]}
              />
            </div>
            <div>
              <Select
                label="Client"
                value={filters.client_id || ''}
                onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
                options={[
                  { value: '', label: 'Tous les clients' },
                  ...uniqueClients.map((client) => ({
                    value: client || '',
                    label: client || '',
                  })),
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Entries List - Grouped */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune entrée de temps</p>
              </div>
            ) : (
              groupedEntries.map((group) => {
                const isExpanded = expandedGroups.has(group.key);
                return (
                  <div key={group.key} className="border border-border rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full p-4 bg-accent hover:bg-accent/80 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground text-left">{group.label}</h3>
                          <p className="text-sm text-muted-foreground text-left">
                            {group.entries.length} entrée{group.entries.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="text-lg">
                        {formatDuration(group.totalDuration)}
                      </Badge>
                    </button>

                    {/* Group Entries */}
                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        {group.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-foreground">
                                    {entry.task_title || 'Tâche sans titre'}
                                  </h4>
                                  <Badge variant="default">{formatDuration(entry.duration)}</Badge>
                                </div>
                                
                                {entry.description && (
                                  <p className="text-sm text-muted-foreground mb-3">{entry.description}</p>
                                )}
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(entry.date)}</span>
                                  </div>
                                  
                                  {entry.project_name && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Briefcase className="w-4 h-4" />
                                      <span>{entry.project_name}</span>
                                    </div>
                                  )}
                                  
                                  {entry.client_name && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Building className="w-4 h-4" />
                                      <span>{entry.client_name}</span>
                                    </div>
                                  )}
                                  
                                  {entry.user_name && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <User className="w-4 h-4" />
                                      <span>{entry.user_name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
}
