'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { timeEntriesAPI, type TimeEntry } from '@/lib/api/time-entries';
import { handleApiError } from '@/lib/errors/api';
import { Calendar, Clock, User, Briefcase, Building, FileText, Download } from 'lucide-react';

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

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);

  // Get unique projects and clients for filters
  const uniqueProjects = Array.from(new Set(entries.map(e => e.project_name).filter(Boolean)));
  const uniqueClients = Array.from(new Set(entries.map(e => e.client_name).filter(Boolean)));

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
          <h2 className="text-lg font-semibold text-foreground mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                value={filters.project_id}
                onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
              >
                <option value="">Tous les projets</option>
                {uniqueProjects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Select
                label="Client"
                value={filters.client_id}
                onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
              >
                <option value="">Tous les clients</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Entries List */}
        <Card className="glass-card p-6">
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune entrée de temps</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-foreground">
                          {entry.task_title || 'Tâche sans titre'}
                        </h3>
                        <Badge variant="outline">{formatDuration(entry.duration)}</Badge>
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
              ))
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
}
