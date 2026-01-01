'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { handleApiError } from '@/lib/errors/api';
import { employeesAPI } from '@/lib/api/employees';
import { projectsAPI } from '@/lib/api/projects';
import { clientsAPI } from '@/lib/api/clients';
import { 
  Calendar, 
  Clock, 
  User, 
  Briefcase, 
  Building, 
  ChevronDown, 
  ChevronUp,
  FileText
} from 'lucide-react';
import {
  groupByWeek,
  groupByMonth,
  groupByEmployee,
  groupByProject,
  groupByClient,
  formatDuration,
  formatDurationHours,
  type GroupedTimeEntry,
} from '@/lib/utils/timesheet';
import type { Employee } from '@/lib/api/employees';
import type { Project } from '@/lib/api/projects';
import type { Client } from '@/lib/api/clients';

// Fix Client interface to match API response
interface ClientWithName extends Client {
  name?: string;
}

type GroupByType = 'week' | 'month' | 'employee' | 'project' | 'client' | 'none';
type ViewMode = 'table' | 'cards';

function FeuillesTempsContent() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    user_id: '',
    project_id: '',
    client_id: '',
  });
  const [groupBy, setGroupBy] = useState<GroupByType>('week');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [filters]);

  const loadData = async () => {
    try {
      // Load employees, projects, clients in parallel
      const [employeesData, projectsData, clientsData] = await Promise.all([
        employeesAPI.list().catch(() => []),
        projectsAPI.list().catch(() => []),
        clientsAPI.list().catch(() => []),
      ]);

      setEmployees(employeesData || []);
      setProjects(projectsData || []);
      setClients(clientsData || []);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: {
        user_id?: number;
        start_date?: string;
        end_date?: string;
        project_id?: number;
        client_id?: number;
      } = {};

      if (filters.user_id) {
        params.user_id = parseInt(filters.user_id);
      }
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
      setError(appError.message || 'Erreur lors du chargement des feuilles de temps');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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

  // Group entries based on selected grouping
  const groupedEntries: GroupedTimeEntry[] = useMemo(() => {
    if (groupBy === 'week') {
      return groupByWeek(entries);
    } else if (groupBy === 'month') {
      return groupByMonth(entries);
    } else if (groupBy === 'employee') {
      return groupByEmployee(entries);
    } else if (groupBy === 'project') {
      return groupByProject(entries);
    } else if (groupBy === 'client') {
      return groupByClient(entries);
    } else {
      return [{
        key: 'all',
        label: 'Toutes les entrées',
        entries,
        totalDuration: entries.reduce((sum, e) => sum + e.duration, 0),
      }];
    }
  }, [entries, groupBy]);

  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalHours = (totalDuration / 3600).toFixed(2);

  // Statistics
  const stats = useMemo(() => {
    const uniqueEmployees = new Set(entries.map(e => e.user_id)).size;
    const uniqueProjects = new Set(entries.map(e => e.project_id).filter(Boolean)).size;
    const uniqueClients = new Set(entries.map(e => e.client_id).filter(Boolean)).size;
    
    return {
      totalEntries: entries.length,
      uniqueEmployees,
      uniqueProjects,
      uniqueClients,
      totalHours: parseFloat(totalHours),
    };
  }, [entries, totalHours]);

  if (loading && entries.length === 0) {
    return (
      <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
        <PageHeader
          title="Feuilles de temps"
          description="Gérez les feuilles de temps"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Management', href: '/dashboard/management' },
            { label: 'Feuilles de temps' },
          ]}
        />
        <div className="glass-card rounded-xl border border-border p-6">
          <div className="py-12 text-center">
            <Loading />
          </div>
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Feuilles de temps"
        description="Visualisez et gérez les heures travaillées par employé, semaine, mois, projet et client"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Management', href: '/dashboard/management' },
          { label: 'Feuilles de temps' },
        ]}
      />

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total heures</p>
              <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entrées</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalEntries}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employés</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueEmployees}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projets</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueProjects}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clients</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueClients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Filtres et regroupement</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          <div>
            <Select
              label="Regrouper par"
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value as GroupByType);
                setExpandedGroups(new Set()); // Reset expanded groups
              }}
              options={[
                { value: 'week', label: 'Semaine' },
                { value: 'month', label: 'Mois' },
                { value: 'employee', label: 'Employé' },
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
              label="Employé"
              value={filters.user_id || ''}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              options={[
                { value: '', label: 'Tous les employés' },
                ...employees.map((emp) => ({
                  value: emp.id.toString(),
                  label: `${emp.first_name} ${emp.last_name}`,
                })),
              ]}
            />
          </div>
          <div>
            <Select
              label="Projet"
              value={filters.project_id || ''}
              onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
              options={[
                { value: '', label: 'Tous les projets' },
                ...projects.map((proj) => ({
                  value: proj.id.toString(),
                  label: proj.name,
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
                ...clients.map((client) => ({
                  value: client.id.toString(),
                  label: client.company_name || client.name || `Client ${client.id}`,
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Entries List - Grouped */}
      <div className="glass-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Entrées de temps</h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Cartes
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Tableau
            </Button>
          </div>
        </div>

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
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{group.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.entries.length} entrée{group.entries.length > 1 ? 's' : ''} • {formatDurationHours(group.totalDuration)}h
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-lg">
                      {formatDuration(group.totalDuration)}
                    </Badge>
                  </button>

                  {/* Group Entries */}
                  {isExpanded && (
                    <div className="p-4">
                      {viewMode === 'table' ? (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-2 text-sm font-medium text-foreground">Date</th>
                              <th className="text-left p-2 text-sm font-medium text-foreground">Employé</th>
                              <th className="text-left p-2 text-sm font-medium text-foreground">Tâche</th>
                              <th className="text-left p-2 text-sm font-medium text-foreground">Projet</th>
                              <th className="text-left p-2 text-sm font-medium text-foreground">Client</th>
                              <th className="text-right p-2 text-sm font-medium text-foreground">Durée</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.entries.map((entry) => (
                              <tr key={entry.id} className="border-b border-border hover:bg-accent">
                                <td className="p-2 text-sm text-foreground">{formatDate(entry.date)}</td>
                                <td className="p-2 text-sm text-foreground">{entry.user_name || '-'}</td>
                                <td className="p-2 text-sm text-foreground">{entry.task_title || '-'}</td>
                                <td className="p-2 text-sm text-foreground">{entry.project_name || '-'}</td>
                                <td className="p-2 text-sm text-foreground">{entry.client_name || '-'}</td>
                                <td className="p-2 text-sm text-foreground text-right">{formatDuration(entry.duration)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="space-y-3">
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
                                    
                                    {entry.user_name && (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        <span>{entry.user_name}</span>
                                      </div>
                                    )}
                                    
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
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </MotionDiv>
  );
}

export default function FeuillesTempsPage() {
  return <FeuillesTempsContent />;
}
