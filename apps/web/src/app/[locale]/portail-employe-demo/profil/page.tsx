'use client';

import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';

export default function MonProfilPage() {
  const profile = {
    firstName: 'Ricardo',
    lastName: 'Wierzynski',
    email: 'ricardo.w@nukleo.com',
    phone: '+1 (514) 555-0123',
    position: 'Développeur Senior',
    department: 'Lab',
    location: 'Montréal, QC',
    startDate: '2023-03-15',
    employeeId: 'EMP-2023-029',
    manager: 'Jean-François Lapointe',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'AWS'],
    certifications: ['AWS Solutions Architect', 'Scrum Master'],
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold">
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-white/80 text-lg">{profile.position}</p>
              </div>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
              <Edit className="w-5 h-5 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Informations personnelles
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Téléphone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Localisation</p>
                <p className="font-medium">{profile.location}</p>
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
              <Briefcase className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Poste</p>
                <p className="font-medium">{profile.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Département</p>
                <p className="font-medium">{profile.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Date d\'embauche</p>
                <p className="font-medium">{new Date(profile.startDate).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Manager</p>
                <p className="font-medium">{profile.manager}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Compétences
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill, idx) => (
            <Badge key={idx} className="bg-[#523DC9]/10 text-[#523DC9] border-[#523DC9]/30">
              {skill}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Certifications
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.certifications.map((cert, idx) => (
            <Badge key={idx} className="bg-green-500/10 text-green-600 border-green-500/30">
              {cert}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
