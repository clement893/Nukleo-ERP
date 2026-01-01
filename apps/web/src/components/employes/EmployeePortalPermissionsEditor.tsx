/**
 * Employee Portal Permissions Editor for Employees
 * 
 * Component for managing employee portal permissions directly on employee pages.
 * Allows admins to configure which modules, pages, and clients an employee can access.
 */

'use client';

import { useState, useEffect } from 'react';
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
import { EMPLOYEE_PORTAL_MODULES } from '@/lib/constants/employee-portal-modules';
import { getCacheKey, setCachedPermissions, permissionsCache } from '@/hooks/useEmployeePortalPermissions';
import { Search, Plus, X, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface EmployeePortalPermissionsEditorProps {
  employeeId: number;
  onUpdate?: () => void;
}

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
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  
  // État pour suivre les permissions initialement chargées (sauvegardées)
  const [savedModules, setSavedModules] = useState<Set<string>>(new Set());
  const [savedClients, setSavedClients] = useState<Set<number>>(new Set());

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
      // Utiliser summaryData comme source principale car elle est plus fiable
      const modulesSet = new Set<string>();
      const clientsSet = new Set<number>();

      // D'abord, utiliser summaryData qui est plus direct
      if (summaryData.modules.includes('*')) {
        // Tous les modules
        EMPLOYEE_PORTAL_MODULES.forEach(m => modulesSet.add(m.id));
      } else {
        // Modules spécifiques
        summaryData.modules.forEach(moduleId => {
          if (moduleId !== '*') {
            modulesSet.add(moduleId);
          }
        });
      }

      if (summaryData.all_clients) {
        // Tous les clients - on ne peut pas charger tous les clients, donc on laisse vide
        // L'utilisateur devra les ajouter manuellement
      } else {
        // Clients spécifiques
        summaryData.clients.forEach(clientId => {
          clientsSet.add(clientId);
        });
      }

      // Ensuite, utiliser permissionsData comme source secondaire pour s'assurer qu'on ne manque rien
      permissionsData.forEach(perm => {
        if (perm.permission_type === 'module') {
          if (perm.resource_id === '*') {
            EMPLOYEE_PORTAL_MODULES.forEach(m => modulesSet.add(m.id));
          } else {
            modulesSet.add(perm.resource_id);
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

      // Mettre à jour les états sélectionnés
      setSelectedModules(modulesSet);
      setSelectedClients(clientsSet);
      
      // Sauvegarder l'état initial pour comparer les changements
      // Utiliser les données chargées pour éviter les problèmes de synchronisation
      setSavedModules(new Set(modulesSet));
      setSavedClients(new Set(clientsSet));

      // Debug: log les permissions chargées
      console.log('[EmployeePortalPermissionsEditor] Permissions chargées:', {
        employeeId,
        summaryData,
        permissionsData: permissionsData.map(p => ({
          type: p.permission_type,
          resource_id: p.resource_id,
        })),
        modulesSet: Array.from(modulesSet),
        clientsSet: Array.from(clientsSet),
      });

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
        metadata?: null;
        can_view: boolean;
        can_edit: boolean;
        can_delete: boolean;
      }> = [];

      // Ajouter les permissions de modules
      console.log('[EmployeePortalPermissionsEditor] Sauvegarde des permissions:', {
        employeeId,
        selectedModules: Array.from(selectedModules),
        selectedClients: Array.from(selectedClients),
      });

      selectedModules.forEach(moduleId => {
        newPermissions.push({
          employee_id: employeeId,
          permission_type: 'module',
          resource_id: moduleId,
          metadata: null,
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
          metadata: null,
          can_view: true,
          can_edit: false,
          can_delete: false,
        });
      });

      // Utiliser la fonction helper pour sauvegarder
      await savePermissions(new Set(selectedModules), new Set(selectedClients));
      
      showToast({
        message: 'Permissions sauvegardées avec succès',
        type: 'success',
      });
      
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

  const handleModuleToggle = async (moduleId: string) => {
    const newSet = new Set(selectedModules);
    const isCurrentlySelected = newSet.has(moduleId);
    
    // Mettre à jour l'état immédiatement pour l'UI
    if (isCurrentlySelected) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setSelectedModules(newSet);
    
    // Sauvegarder immédiatement en utilisant la fonction helper
    try {
      await savePermissions(newSet, new Set(selectedClients));
    } catch (err) {
      // En cas d'erreur, restaurer l'état précédent
      setSelectedModules(selectedModules);
    }
  };

  const handleAddClient = async (client: Contact) => {
    if (!selectedClients.has(client.id)) {
      const newClientsSet = new Set(selectedClients);
      newClientsSet.add(client.id);
      setSelectedClients(newClientsSet);
      setClients(prev => [...prev, client]);
      setShowClientModal(false);
      setClientSearchTerm('');
      
      // Sauvegarder immédiatement
      await savePermissions(new Set(selectedModules), newClientsSet);
    }
  };

  const handleRemoveClient = async (clientId: number) => {
    const newClientsSet = new Set(selectedClients);
    newClientsSet.delete(clientId);
    setSelectedClients(newClientsSet);
    setClients(prev => prev.filter(c => c.id !== clientId));
    
    // Sauvegarder immédiatement
    await savePermissions(new Set(selectedModules), newClientsSet);
  };

  // Fonction helper pour sauvegarder les permissions
  const savePermissions = async (modules: Set<string>, clients: Set<number>) => {
    // Sauvegarder l'ancien état pour rollback en cas d'erreur
    const oldModules = new Set(savedModules);
    const oldClients = new Set(savedClients);
    const cacheKey = getCacheKey(employeeId);
    const oldCachedData = cacheKey && cacheKey !== 'none' 
      ? permissionsCache.get(cacheKey)?.data || null 
      : null;
    
    try {
      // IMPORTANT: Supprimer toutes les permissions existantes AVANT de créer les nouvelles
      // Cela garantit que les anciennes permissions sont bien supprimées de la base de données
      await employeePortalPermissionsAPI.deleteAllForEmployee(employeeId);
      
      // Créer les nouvelles permissions
      const newPermissions: Array<{
        employee_id: number;
        permission_type: 'page' | 'module' | 'client';
        resource_id: string;
        metadata?: null;
        can_view: boolean;
        can_edit: boolean;
        can_delete: boolean;
      }> = [];
      
      // Ajouter les permissions de modules
      modules.forEach(moduleId => {
        newPermissions.push({
          employee_id: employeeId,
          permission_type: 'module',
          resource_id: moduleId,
          metadata: null,
          can_view: true,
          can_edit: false,
          can_delete: false,
        });
      });
      
      // Ajouter les permissions de clients
      clients.forEach(clientId => {
        newPermissions.push({
          employee_id: employeeId,
          permission_type: 'client',
          resource_id: clientId.toString(),
          metadata: null,
          can_view: true,
          can_edit: false,
          can_delete: false,
        });
      });
      
      // Créer les nouvelles permissions (même si la liste est vide pour garantir la cohérence)
      if (newPermissions.length > 0) {
        await employeePortalPermissionsAPI.bulkCreate({
          employee_id: employeeId,
          permissions: newPermissions,
        });
      }
      
      // IMPORTANT: Mettre à jour les états sauvegardés APRÈS que toutes les opérations DB soient terminées
      // Créer de nouveaux Sets pour forcer React à détecter le changement
      setSavedModules(new Set(modules));
      setSavedClients(new Set(clients));
      
      // ✅ INSTANTANÉ: Mettre à jour le cache directement avec les nouvelles données
      // Cela permet au portail de se mettre à jour immédiatement sans attendre un rechargement depuis le serveur
      if (cacheKey && cacheKey !== 'none') {
        const newSummary: EmployeePortalPermissionSummary = {
          user_id: null,
          employee_id: employeeId,
          pages: ['*'], // Pages de base toujours accessibles
          modules: Array.from(modules),
          projects: [],
          clients: Array.from(clients),
          all_projects: false,
          all_clients: false,
        };
        setCachedPermissions(cacheKey, newSummary);
      }
      
      // Déclencher l'événement APRÈS la mise à jour des états pour notifier les autres composants
      // Utiliser Promise.resolve().then() au lieu de setTimeout(0) pour plus de prévisibilité
      Promise.resolve().then(() => {
        window.dispatchEvent(new CustomEvent('employee-portal-permissions-updated', {
          detail: { employeeId }
        }));
      });
      
      // Ne pas recharger loadData() ici car cela réinitialiserait les états et causerait un flash
      // Les données sont déjà sauvegardées sur le serveur, et les états locaux sont déjà à jour
      // Le rechargement se fera automatiquement via le cache invalidation dans les autres composants
    } catch (err) {
      // ❌ Erreur: restaurer l'ancien état et le cache
      setSavedModules(oldModules);
      setSavedClients(oldClients);
      
      if (cacheKey && cacheKey !== 'none' && oldCachedData) {
        setCachedPermissions(cacheKey, oldCachedData);
      }
      
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la sauvegarde',
        type: 'error',
      });
      throw err;
    }
  };

  // Vérifier s'il y a des changements non sauvegardés
  const hasUnsavedChanges = 
    selectedModules.size !== savedModules.size ||
    selectedClients.size !== savedClients.size ||
    Array.from(selectedModules).some(m => !savedModules.has(m)) ||
    Array.from(savedModules).some(m => !selectedModules.has(m)) ||
    Array.from(selectedClients).some(c => !savedClients.has(c)) ||
    Array.from(savedClients).some(c => !selectedClients.has(c));

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

      {/* Diagnostic Panel - à retirer en production */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h4 className="text-sm font-semibold mb-2">🔍 Diagnostic des Permissions</h4>
          <div className="text-xs space-y-1 font-mono">
            <div>Employee ID: {employeeId}</div>
            <div>Modules sélectionnés: [{Array.from(selectedModules).join(', ')}]</div>
            <div>Modules sauvegardés: [{Array.from(savedModules).join(', ')}]</div>
            <div>Clients sélectionnés: [{Array.from(selectedClients).join(', ')}]</div>
            <div>Clients sauvegardés: [{Array.from(savedClients).join(', ')}]</div>
            <div>Changements non sauvegardés: {hasUnsavedChanges ? 'OUI' : 'NON'}</div>
            <div>Nombre de permissions chargées: {_permissions.length}</div>
            {_summary && (
              <div>Summary modules: [{_summary.modules.join(', ')}]</div>
            )}
          </div>
        </Card>
      )}

      {/* Résumé des permissions actives */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Modules actifs
              </div>
              <div className="text-2xl font-bold text-foreground">
                {savedModules.size}
              </div>
              <div className="text-xs text-muted-foreground">
                sur {EMPLOYEE_PORTAL_MODULES.length} disponibles
              </div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Clients actifs
              </div>
              <div className="text-2xl font-bold text-foreground">
                {savedClients.size}
              </div>
            </div>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="warning" className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Modifications non sauvegardées
            </Badge>
          )}
          {!hasUnsavedChanges && savedModules.size > 0 && (
            <Badge variant="success" className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              Toutes les modifications sont sauvegardées
            </Badge>
          )}
        </div>
      </Card>

      {/* Modules ERP */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Modules ERP accessibles</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sélectionnez les modules ERP complets que l'employé peut utiliser dans son portail. 
          Chaque module inclut toutes ses sous-pages.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EMPLOYEE_PORTAL_MODULES.map(module => (
            <div 
              key={module.id} 
              className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedModules.has(module.id) 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => handleModuleToggle(module.id)}
            >
              <Checkbox
                checked={selectedModules.has(module.id)}
                onChange={() => handleModuleToggle(module.id)}
                id={`module-${module.id}`}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`module-${module.id}`}
                    className="text-sm font-medium cursor-pointer block"
                  >
                    {module.label}
                  </label>
                  {savedModules.has(module.id) && (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Actif
                    </Badge>
                  )}
                  {selectedModules.has(module.id) && !savedModules.has(module.id) && (
                    <Badge variant="warning" className="text-xs">
                      Nouveau
                    </Badge>
                  )}
                  {!selectedModules.has(module.id) && savedModules.has(module.id) && (
                    <Badge variant="error" className="text-xs">
                      À supprimer
                    </Badge>
                  )}
                </div>
                {module.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {module.description}
                  </p>
                )}
                {module.subPages && module.subPages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {module.subPages.length} sous-page{module.subPages.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Note sur les pages de base */}
      <Card className="p-6 bg-muted/50">
        <h3 className="text-sm font-semibold mb-2">Pages de base du portail</h3>
        <p className="text-xs text-muted-foreground">
          Les pages suivantes sont toujours accessibles dans le portail employé : 
          Tableau de bord, Mes tâches, Mes projets, Mes feuilles de temps, Mon Leo, 
          Mes deadlines, Mes comptes de dépenses, Mes vacances, Mon profil.
        </p>
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
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  savedClients.has(client.id)
                    ? 'border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-900/20'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        {client.first_name} {client.last_name}
                      </div>
                      {savedClients.has(client.id) && (
                        <Badge variant="success" className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                      {selectedClients.has(client.id) && !savedClients.has(client.id) && (
                        <Badge variant="warning" className="text-xs">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                    {client.company_name && (
                      <div className="text-sm text-muted-foreground">
                        {client.company_name}
                      </div>
                    )}
                  </div>
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
      <div className="flex justify-end gap-3">
        {hasUnsavedChanges && (
          <Alert variant="warning" className="flex-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Vous avez des modifications non sauvegardées</span>
            </div>
          </Alert>
        )}
        <Button
          onClick={handleSave}
          loading={saving}
          size="lg"
          disabled={!hasUnsavedChanges && !saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {hasUnsavedChanges ? 'Sauvegarder les modifications' : 'Tout est sauvegardé'}
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
