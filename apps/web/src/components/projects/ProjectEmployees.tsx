'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Select, Modal } from '@/components/ui';
import { 
  Users, Plus, X, Search, Loader2, UserCircle
} from 'lucide-react';
import { projectsAPI, type ProjectEmployee } from '@/lib/api/projects';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

interface ProjectEmployeesProps {
  projectId: number;
}

export default function ProjectEmployees({ projectId }: ProjectEmployeesProps) {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<ProjectEmployee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignedEmployees, allEmployeesList] = await Promise.all([
        projectsAPI.getEmployees(projectId),
        employeesAPI.list()
      ]);
      setEmployees(assignedEmployees);
      setAllEmployees(allEmployeesList);
    } catch (error) {
      logger.error('Error loading project employees', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les employés du projet',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!selectedEmployeeId) return;

    try {
      setAdding(true);
      await projectsAPI.assignEmployee(projectId, selectedEmployeeId, selectedRole || undefined);
      showToast({
        title: 'Succès',
        message: 'Employé assigné au projet avec succès',
        type: 'success'
      });
      setShowAddModal(false);
      setSelectedEmployeeId(null);
      setSelectedRole('');
      await loadData();
    } catch (error) {
      logger.error('Error assigning employee', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible d\'assigner l\'employé au projet',
        type: 'error'
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveEmployee = async (employeeId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet employé du projet ?')) return;

    try {
      await projectsAPI.removeEmployee(projectId, employeeId);
      showToast({
        title: 'Succès',
        message: 'Employé retiré du projet avec succès',
        type: 'success'
      });
      await loadData();
    } catch (error) {
      logger.error('Error removing employee', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de retirer l\'employé du projet',
        type: 'error'
      });
    }
  };

  // Filter employees that are not already assigned
  const availableEmployees = allEmployees.filter(emp => 
    !employees.some(assigned => assigned.employee_id === emp.id) &&
    (searchTerm === '' || 
     `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  if (loading) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employés assignés ({employees.length})
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un employé
          </Button>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun employé assigné à ce projet</p>
            <p className="text-sm mt-2">Cliquez sur "Ajouter un employé" pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <Card
                key={employee.id}
                className="glass-card p-4 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {employee.photo_url ? (
                      <img
                        src={employee.photo_url}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {employee.first_name} {employee.last_name}
                      </p>
                      {employee.job_title && (
                        <p className="text-sm text-muted-foreground truncate">
                          {employee.job_title}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {employee.email}
                      </p>
                      {employee.role && (
                        <Badge variant="default" className="mt-1 text-xs">
                          {employee.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmployee(employee.employee_id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedEmployeeId(null);
          setSelectedRole('');
          setSearchTerm('');
        }}
        title="Ajouter un employé au projet"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedEmployeeId(null);
                setSelectedRole('');
                setSearchTerm('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleAddEmployee}
              disabled={!selectedEmployeeId || adding}
            >
              {adding ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rechercher un employé</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Employé *</label>
            <Select
              value={selectedEmployeeId?.toString() || ''}
              onChange={(e) => setSelectedEmployeeId(e.target.value ? parseInt(e.target.value) : null)}
              options={[
                { value: '', label: 'Sélectionner un employé...' },
                ...availableEmployees.map(emp => ({
                  value: emp.id.toString(),
                  label: `${emp.first_name} ${emp.last_name} (${emp.email})`
                }))
              ]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rôle (optionnel)</label>
            <Input
              type="text"
              placeholder="Ex: Lead, Membre, Viewer..."
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
          </div>

          {availableEmployees.length === 0 && searchTerm && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Aucun employé trouvé
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
