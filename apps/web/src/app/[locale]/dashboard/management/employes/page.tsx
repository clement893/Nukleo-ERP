'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, Alert, Loading } from '@/components/ui';
import { employeesAPI, type Employee } from '@/lib/api/employees';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { agendaAPI, type CalendarEventCreate } from '@/lib/api/agenda';

function EmployesContent() {
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
                date: thisYearBirthday.toISOString().split('T')[0] as string,
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
          <div className="py-12 text-center text-muted-foreground">
            Module de liste retiré. Prêt pour l'intégration d'un nouveau module.
          </div>
        </Card>
      )}
    </MotionDiv>
  );
}

export default function EmployesPage() {
  return <EmployesContent />;
}
