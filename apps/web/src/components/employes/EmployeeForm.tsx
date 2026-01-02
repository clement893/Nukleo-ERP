'use client';

import { useState, useEffect } from 'react';
import { Employee, EmployeeCreate, EmployeeUpdate } from '@/lib/api/employees';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { teamsAPI, type Team } from '@/lib/api/teams';
import { handleApiError } from '@/lib/errors/api';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (data: EmployeeCreate | EmployeeUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'on_leave', label: 'En congé' },
  { value: 'terminated', label: 'Terminé' },
];

const EMPLOYEE_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Temps plein' },
  { value: 'part_time', label: 'Temps partiel' },
  { value: 'contractor', label: 'Contractuel' },
  { value: 'intern', label: 'Stagiaire' },
];

export default function EmployeeForm({
  employee,
  onSubmit,
  onCancel,
  loading = false,
}: EmployeeFormProps) {
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState<EmployeeCreate>({
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    email: employee?.email || null,
    phone: employee?.phone || null,
    linkedin: employee?.linkedin || null,
    photo_url: employee?.photo_url || null,
    photo_filename: employee?.photo_filename || null,
    hire_date: employee?.hire_date || null,
    birthday: employee?.birthday || null,
    capacity_hours_per_week: employee?.capacity_hours_per_week || 35,
    team_id: employee?.team_id || null,
    status: employee?.status || 'active',
    department: employee?.department || null,
    job_title: employee?.job_title || null,
    employee_type: employee?.employee_type || 'full_time',
    employee_number: employee?.employee_number || null,
    salary: employee?.salary || null,
    hourly_rate: employee?.hourly_rate || null,
    address: employee?.address || null,
    city: employee?.city || null,
    postal_code: employee?.postal_code || null,
    country: employee?.country || null,
    notes: employee?.notes || null,
    termination_date: employee?.termination_date || null,
    manager_id: employee?.manager_id || null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const teamsResponse = await teamsAPI.list(0, 1000);
        const teamsData = teamsResponse.data?.teams || [];
        setTeams(teamsData);
      } catch (err) {
        const appError = handleApiError(err);
        showToast({
          message: appError.message || 'Erreur lors du chargement des données',
          type: 'error',
        });
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      showToast({
        message: 'Le prénom et le nom sont requis',
        type: 'error',
      });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Prénom *"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
          disabled={loading}
        />

        <Input
          label="Nom *"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
          disabled={loading}
        />

        <Input
          label="Email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Téléphone"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="LinkedIn"
          type="url"
          value={formData.linkedin || ''}
          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Numéro d'employé"
          value={formData.employee_number || ''}
          onChange={(e) => setFormData({ ...formData, employee_number: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Titre du poste"
          value={formData.job_title || ''}
          onChange={(e) => setFormData({ ...formData, job_title: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Département"
          value={formData.department || ''}
          onChange={(e) => setFormData({ ...formData, department: e.target.value || null })}
          disabled={loading}
        />

        <Select
          label="Statut"
          value={formData.status || 'active'}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          options={STATUS_OPTIONS}
          disabled={loading || loadingData}
        />

        <Select
          label="Type d'employé"
          value={formData.employee_type || 'full_time'}
          onChange={(e) => setFormData({ ...formData, employee_type: e.target.value as any })}
          options={EMPLOYEE_TYPE_OPTIONS}
          disabled={loading || loadingData}
        />

        <Select
          label="Équipe"
          value={formData.team_id?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              team_id: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          options={[
            { value: '', label: 'Aucune équipe' },
            ...teams.map(t => ({ value: t.id.toString(), label: t.name }))
          ]}
          disabled={loading || loadingData}
        />

        <Input
          label="Capacité (heures/semaine)"
          type="number"
          step="0.5"
          value={formData.capacity_hours_per_week?.toString() || '35'}
          onChange={(e) =>
            setFormData({
              ...formData,
              capacity_hours_per_week: e.target.value ? parseFloat(e.target.value) : 35,
            })
          }
          disabled={loading}
        />

        <Input
          label="Salaire ($)"
          type="number"
          step="0.01"
          value={formData.salary?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              salary: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
          disabled={loading}
        />

        <Input
          label="Taux horaire ($)"
          type="number"
          step="0.01"
          value={formData.hourly_rate?.toString() || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              hourly_rate: e.target.value ? parseFloat(e.target.value) : null,
            })
          }
          disabled={loading}
        />

        <Input
          label="Date d'embauche"
          type="date"
          value={formData.hire_date ? new Date(formData.hire_date).toISOString().split('T')[0] : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              hire_date: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
          disabled={loading}
        />

        <Input
          label="Date de naissance"
          type="date"
          value={formData.birthday ? new Date(formData.birthday).toISOString().split('T')[0] : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              birthday: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
          disabled={loading}
        />

        <Input
          label="Date de fin d'emploi"
          type="date"
          value={formData.termination_date ? new Date(formData.termination_date).toISOString().split('T')[0] : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              termination_date: e.target.value ? new Date(e.target.value).toISOString() : null,
            })
          }
          disabled={loading}
        />

        <div className="md:col-span-2">
          <Input
            label="Adresse"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
            disabled={loading}
          />
        </div>

        <Input
          label="Ville"
          value={formData.city || ''}
          onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Code postal"
          value={formData.postal_code || ''}
          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value || null })}
          disabled={loading}
        />

        <Input
          label="Pays"
          value={formData.country || ''}
          onChange={(e) => setFormData({ ...formData, country: e.target.value || null })}
          disabled={loading}
        />

        <div className="md:col-span-2">
          <Textarea
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
            rows={4}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : employee ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
