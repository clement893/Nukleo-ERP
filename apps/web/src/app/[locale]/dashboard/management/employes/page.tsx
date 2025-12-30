'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Plus, Edit, Trash2, Eye, Linkedin, Mail, Phone, Calendar, Briefcase } from 'lucide-react';
import { clsx } from 'clsx';
import MotionDiv from '@/components/motion/MotionDiv';
import { agendaAPI, type CalendarEventCreate } from '@/lib/api/agenda';

function EmployesContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load employees
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeesAPI.list(0, 1000);
      setEmployees(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des employés');
      showToast({
        message: appError.message || 'Erreur lors du chargement des employés',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Add birthdays to calendar
  useEffect(() => {
    const addBirthdaysToCalendar = async () => {
      try {
        // Get all calendar events to check if birthdays already exist
        const existingEvents = await agendaAPI.list();
        
        // Filter employees with birth_date
        const employeesWithBirthday = employees.filter(emp => emp.birth_date);
        
        for (const employee of employeesWithBirthday) {
          if (!employee.birth_date) continue;
          
          // Check if birthday event already exists
          const birthdayExists = existingEvents.some(event => 
            event.title === `Anniversaire - ${employee.first_name} ${employee.last_name}` &&
            event.type === 'reminder'
          );
          
          if (!birthdayExists) {
            // Create birthday event for this year
            const birthDate = new Date(employee.birth_date);
            const currentYear = new Date().getFullYear();
            const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
            
            // Only create if birthday hasn't passed this year
            if (thisYearBirthday >= new Date()) {
              const eventData: CalendarEventCreate = {
                title: `Anniversaire - ${employee.first_name} ${employee.last_name}`,
                description: `Anniversaire de ${employee.first_name} ${employee.last_name}`,
                date: thisYearBirthday.toISOString().split('T')[0],
                type: 'reminder',
                color: '#EC4899', // Pink color for birthdays
              };
              
              try {
                await agendaAPI.create(eventData);
              } catch (err) {
                // Silently fail if event creation fails (might already exist)
                console.warn(`Failed to create birthday event for ${employee.first_name} ${employee.last_name}:`, err);
              }
            }
          }
        }
      } catch (err) {
        // Silently fail - birthdays are optional
        console.warn('Failed to add birthdays to calendar:', err);
      }
    };

    if (employees.length > 0) {
      addBirthdaysToCalendar();
    }
  }, [employees]);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Table columns
  const columns: Column<Employee>[] = [
    {
      key: 'photo_url',
      label: '',
      sortable: false,
      render: (value, employee) => (
        <div className="flex items-center">
          {value ? (
            <img
              src={String(value)}
              alt={`${employee.first_name} ${employee.last_name}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">
                {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'first_name',
      label: 'Nom',
      sortable: true,
      render: (_value, employee) => (
        <div>
          <div className="font-medium">{employee.first_name} {employee.last_name}</div>
          {employee.job_title && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {employee.job_title}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Courriel',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
        </div>
      ),
    },
    {
      key: 'hire_date',
      label: 'Date d\'embauche',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{formatDate(value as string)}</span>
        </div>
      ),
    },
    {
      key: 'birth_date',
      label: 'Anniversaire',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{formatDate(value as string)}</span>
        </div>
      ),
    },
    {
      key: 'linkedin_url',
      label: 'LinkedIn',
      sortable: false,
      render: (value) => (
        <div className="flex items-center">
          {value ? (
            <a
              href={String(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="w-5 h-5" />
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Employés"
        description={`Gérez vos employés${employees.length > 0 ? ` - ${employees.length} employé${employees.length > 1 ? 's' : ''}` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Management', href: '/dashboard/management' },
          { label: 'Employés' },
        ]}
      />

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading && employees.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable
            data={employees as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            pagination={true}
            pageSize={20}
            searchable={true}
            filterable={false}
            emptyMessage="Aucun employé trouvé"
            loading={loading}
            actions={(row) => {
              const employee = row as unknown as Employee;
              return [
                {
                  label: 'Voir',
                  onClick: () => {
                    // TODO: Navigate to employee detail page
                    showToast({
                      message: 'Fonctionnalité à venir',
                      type: 'info',
                    });
                  },
                  icon: <Eye className="w-4 h-4" />,
                },
                {
                  label: 'Modifier',
                  onClick: () => {
                    // TODO: Open edit modal
                    showToast({
                      message: 'Fonctionnalité à venir',
                      type: 'info',
                    });
                  },
                  icon: <Edit className="w-4 h-4" />,
                },
                {
                  label: 'Supprimer',
                  onClick: () => {
                    // TODO: Implement delete
                    showToast({
                      message: 'Fonctionnalité à venir',
                      type: 'info',
                    });
                  },
                  icon: <Trash2 className="w-4 h-4" />,
                  variant: 'danger',
                },
              ];
            }}
          />
        </Card>
      )}
    </MotionDiv>
  );
}

export default function EmployesPage() {
  return <EmployesContent />;
}
