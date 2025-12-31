/**
 * Employee Portal Permissions Editor for Employees
 * 
 * Component for managing employee portal permissions directly on employee pages.
 * Allows admins to configure which modules, pages, and clients an employee can access.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/ui/Checkbox';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import { employeePortalPermissionsAPI, type EmployeePortalPermission, type EmployeePortalPermissionSummary } from '@/lib/api/employee-portal-permissions';
import { contactsAPI, type Contact } from '@/lib/api/contacts';
import { handleApiError } from '@/lib/errors/api';
// Pages du portail employé (basées sur EmployeePortalNavigation)
const EMPLOYEE_PORTAL_PAGES = [
  { path: 'dashboard', label: 'Tableau de bord' },
  { path: 'taches', label: 'Mes tâches' },
  { path: 'projets', label: 'Mes projets' },
  { path: 'feuilles-de-temps', label: 'Mes feuilles de temps' },
  { path: 'leo', label: 'Mon Leo' },
  { path: 'deadlines', label: 'Mes deadlines' },
  { path: 'depenses', label: 'Mes comptes de dépenses' },
  { path: 'vacances', label: 'Mes vacances' },
  { path: 'profil', label: 'Mon profil' },
];
import { Search, Plus, X, Save } from 'lucide-react';

interface EmployeePortalPermissionsEditorProps {
  employeeId: number;
  onUpdate?: () => void;
}

// Modules disponibles dans le portail ERP
const AVAILABLE_MODULES = [
  { id: 'crm', label: 'CRM' },
  { id: 'orders', label: 'Commandes' },
  { id: 'inventory', label: 'Inventaire' },
  { id: 'accounting', label: 'Comptabilité' },
  { id: 'reports', label: 'Rapports' },
  { id: 'tasks', label: 'Tâches' },
  { id: 'timesheet', label: 'Feuilles de temps' },
  { id: 'settings', label: 'Paramètres' },
];

export default function EmployeePortalPermissionsEditor({
  employeeId,
  onUpdate,
}: EmployeePortalPermissionsEditorProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_summary, setSummary] = useState<EmployeePortalPermissionSummary | null>(null);
  const [_permissions, setPermissions] = useState<EmployeePortalPermission[]>([]);
  const [clients, setClients] = useState<Contact[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);

  // État local pour les cases à cocher
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, permissionsData] = await Promise.all([
        employeePortalPermissionsAPI.getSummaryForEmployee(employeeId),
        employeePortalPermissionsAPI.list({ employee_id: employeeId }),
      ]);

      setSummary(summaryData);
      setPermissions(permissionsData);

      // Initialiser les états des cases à cocher
      const modulesSet = new Set<string>();
      const pagesSet = new Set<string>();
      const clientsSet = new Set<number>();

      permissionsData.forEach(perm => {
        if (perm.permission_type === 'module') {
          if (perm.resource_id === '*') {
            AVAILABLE_MODULES.forEach(m => modulesSet.add(m.id));
          } else {
            modulesSet.add(perm.resource_id);
          }
        } else if (perm.permission_type === 'page') {
          if (perm.resource_id === '*') {
            EMPLOYEE_PORTAL_PAGES.forEach(p => pagesSet.add(p.path));
          } else {
            pagesSet.add(perm.resource_id);
          }
        } else if (perm.permission_type === 'client') {
          if (perm.resource_id === '*') {
            // Tous les clients - on gère ça différemment
          } else {
            const clientId = parseInt(perm.resource_id);
            if (!isNaN(clientId)) {
              clientsSet.add(clientId);
            }
          }
        }
      });

      setSelectedModules(modulesSet);
      setSelectedPages(pagesSet);
      setSelectedClients(clientsSet);

      // Charger les clients sélectionnés
      if (clientsSet.size > 0) {
        const clientsData = await Promise.all(
          Array.from(clientsSet).map(id => 
            contactsAPI.get(id).catch(() => null)
          )
        );
        setClients(clientsData.filter(c => c !== null) as Contact[]);
      }
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des permissions');
      showToast({
        message: appError.message || 'Erreur lors du chargement des permissions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Supprimer toutes les permissions existantes
      await employeePortalPermissionsAPI.deleteAllForEmployee(employeeId);

      // Créer les nouvelles permissions
      const newPermissions: Array<{
        employee_id: number;
        permission_type: 'page' | 'module' | 'client';
        resource_id: string;
        can_view: boolean;
        can_edit: boolean;
        can_delete: boolean;
      }> = [];

      // Ajouter les permissions de modules
      selectedModules.forEach(moduleId => {
        newPermissions.push({
          employee_id: employeeId,
          permission_type: 'module',
          resource_id: moduleId,
          can_view: true,
          can_edit: false,
          can_delete: false,
        });
      });

      // Ajouter les permissions de pages
      selectedPages.forEach(pagePath => {
        newPermissions.push({
          employee_id: employeeId,
          permission_type: 'page',
          resource_id: pagePath,
          can_view: true,
          can_edit: false,
          can_delete: false,
        });
      });

      // Ajouter les permissions de clients
      selectedClients.forEach(clientId => {
        newPermissions.push({
          employee_id: employeeId,
          permission_type: 'client',
          resource_id: clientId.toString(),
          can_view: true,
          can_edit: false,
          can_delete: false,
        });
      });

      if (newPermissions.length > 0) {
        await employeePortalPermissionsAPI.bulkCreate({
          employee_id: employeeId,
          permissions: newPermissions,
        });
      }

      showToast({
        message: 'Permissions sauvegardées avec succès',
        type: 'success',
      });

      await loadData();
      onUpdate?.();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la sauvegarde');
      showToast({
        message: appError.message || 'Erreur lors de la sauvegarde',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handlePageToggle = (pagePath: string) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pagePath)) {
        newSet.delete(pagePath);
      } else {
        newSet.add(pagePath);
      }
      return newSet;
    });
  };

  const handleAddClient = async (client: Contact) => {
    if (!selectedClients.has(client.id)) {
      setSelectedClients(prev => new Set(prev).add(client.id));
      setClients(prev => [...prev, client]);
      setShowClientModal(false);
      setClientSearchTerm('');
    }
  };

  const handleRemoveClient = (clientId: number) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      newSet.delete(clientId);
      return newSet;
    });
    setClients(prev => prev.filter(c => c.id !== clientId));
  };

  const _searchClients = async (searchTerm: string) => {
    if (searchTerm.length < 2) return [];
    try {
      const results = await contactsAPI.list(0, 20);
      return results.filter(client => {
        const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
        const companyName = (client.company_name || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || companyName.includes(search);
      });
    } catch (err) {
      return [];
    }
  };

  const _filteredClients = useMemo(() => {
    if (!clientSearchTerm) return [];
    // On va utiliser une recherche côté client pour l'instant
    return clients.filter(client => {
      const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
      const companyName = (client.company_name || '').toLowerCase();
      const search = clientSearchTerm.toLowerCase();
      return fullName.includes(search) || companyName.includes(search);
    });
  }, [clientSearchTerm, clients]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Modules */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Modules accessibles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AVAILABLE_MODULES.map(module => (
            <div key={module.id} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedModules.has(module.id)}
                onChange={() => handleModuleToggle(module.id)}
                id={`module-${module.id}`}
              />
              <label
                htmlFor={`module-${module.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                {module.label}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Pages */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pages accessibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EMPLOYEE_PORTAL_PAGES.map(page => (
            <div key={page.path} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedPages.has(page.path)}
                onChange={() => handlePageToggle(page.path)}
                id={`page-${page.path}`}
              />
              <label
                htmlFor={`page-${page.path}`}
                className="text-sm font-medium cursor-pointer"
              >
                {page.label}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Clients */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Clients accessibles</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowClientModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un client
          </Button>
        </div>

        {selectedClients.size === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun client sélectionné. L'employé n'aura accès à aucun client.
          </p>
        ) : (
          <div className="space-y-2">
            {clients.map(client => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {client.first_name} {client.last_name}
                  </div>
                  {client.company_name && (
                    <div className="text-sm text-muted-foreground">
                      {client.company_name}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveClient(client.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={saving}
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder les permissions
        </Button>
      </div>

      {/* Modal de recherche de clients */}
      <Modal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setClientSearchTerm('');
        }}
        title="Rechercher un client"
      >
        <div className="space-y-4">
          <Input
            placeholder="Rechercher par nom ou entreprise..."
            value={clientSearchTerm}
            onChange={(e) => setClientSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <div className="max-h-96 overflow-y-auto space-y-2">
            {clientSearchTerm.length >= 2 ? (
              <ClientSearchResults
                searchTerm={clientSearchTerm}
                selectedClients={selectedClients}
                onAddClient={handleAddClient}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tapez au moins 2 caractères pour rechercher
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Composant pour les résultats de recherche de clients
function ClientSearchResults({
  searchTerm,
  selectedClients,
  onAddClient,
}: {
  searchTerm: string;
  selectedClients: Set<number>;
  onAddClient: (client: Contact) => void;
}) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Contact[]>([]);

  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const allClients = await contactsAPI.list(0, 100);
        const filtered = allClients.filter(client => {
          const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
          const companyName = (client.company_name || '').toLowerCase();
          const search = searchTerm.toLowerCase();
          return fullName.includes(search) || companyName.includes(search);
        });
        setResults(filtered.slice(0, 20)); // Limiter à 20 résultats
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  if (searching) {
    return <Loading />;
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Aucun client trouvé
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {results.map(client => (
        <div
          key={client.id}
          className={`flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
            selectedClients.has(client.id) ? 'bg-muted opacity-50' : ''
          }`}
          onClick={() => !selectedClients.has(client.id) && onAddClient(client)}
        >
          <div>
            <div className="font-medium">
              {client.first_name} {client.last_name}
            </div>
            {client.company_name && (
              <div className="text-sm text-muted-foreground">
                {client.company_name}
              </div>
            )}
          </div>
          {selectedClients.has(client.id) && (
            <Badge variant="default">Déjà ajouté</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
