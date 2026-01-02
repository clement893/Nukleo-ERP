'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Award, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { employeesAPI, type Employee } from '@/lib/api/employees';

export default function MonProfil() {
  const params = useParams();
  const employeeId = parseInt(params?.id as string);
  
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (employeeId) {
      loadEmployee();
    }
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const data = await employeesAPI.get(employeeId);
      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
      </div>
    );
  }

  if (!employee) {
    return <div>Employé non trouvé</div>;
  }

  const getInitials = () => {
    return `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
  };

  const getAvatarColor = () => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
    return colors[employee.id % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full ${getAvatarColor()} flex items-center justify-center text-white text-3xl font-bold`}>
              {getInitials()}
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-white/80 text-lg">{employee.job_title || 'Poste non spécifié'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Informations personnelles
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#523DC9]" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{employee.email || 'Non renseigné'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#523DC9]" />
              <div>
                <p className="text-xs text-gray-500">Téléphone</p>
                <p className="font-medium">{employee.phone || 'Non renseigné'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#523DC9]" />
              <div>
                <p className="text-xs text-gray-500">Localisation</p>
                <p className="font-medium">{employee.city || employee.address || 'Non renseignée'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Informations professionnelles
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-[#523DC9]" />
              <div>
                <p className="text-xs text-gray-500">Poste</p>
                <p className="font-medium">{employee.job_title || 'Non spécifié'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#523DC9]" />
              <div>
                <p className="text-xs text-gray-500">Département</p>
                <p className="font-medium">{employee.department || 'Non spécifié'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#523DC9]" />
              <div>
                <p className="text-xs text-gray-500">Date d'embauche</p>
                <p className="font-medium">
                  {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#523DC9]" />
              <div>
                <p className="text-xs text-gray-500">Manager</p>
                <p className="font-medium">{employee.manager_id ? 'Manager assigné' : 'Non assigné'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
