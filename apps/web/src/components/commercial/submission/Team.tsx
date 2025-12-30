'use client';

import { SubmissionWizardData } from '../SubmissionWizard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus, Trash2, UserCircle } from 'lucide-react';

interface TeamProps {
  data: SubmissionWizardData;
  onChange: (updates: Partial<SubmissionWizardData>) => void;
}

export default function SubmissionTeam({
  data,
  onChange,
}: TeamProps) {
  const addTeamMember = () => {
    onChange({
      teamMembers: [
        ...data.teamMembers,
        { name: '', role: '', bio: '' },
      ],
    });
  };

  const updateTeamMember = (index: number, field: 'name' | 'role' | 'bio', value: string) => {
    const newMembers = [...data.teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    onChange({ teamMembers: newMembers });
  };

  const removeTeamMember = (index: number) => {
    const newMembers = data.teamMembers.filter((_, i) => i !== index);
    onChange({ teamMembers: newMembers });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Équipe de projet</h2>
        <p className="text-muted-foreground">
          Présentez les membres de l'équipe qui travailleront sur ce projet
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-foreground">
            Membres de l'équipe
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTeamMember}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter un membre
          </Button>
        </div>

        {data.teamMembers.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
            <p>Aucun membre d'équipe</p>
            <p className="text-sm mt-1">Cliquez sur "Ajouter un membre" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.teamMembers.map((member, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg bg-muted/30 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
                      <UserCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      Membre {index + 1}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMember(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nom complet"
                    value={member.name}
                    onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                    fullWidth
                    placeholder="Ex: Jean Dupont"
                  />
                  <Input
                    label="Rôle"
                    value={member.role}
                    onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                    fullWidth
                    placeholder="Ex: Chef de projet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">
                    Biographie
                  </label>
                  <textarea
                    value={member.bio}
                    onChange={(e) => updateTeamMember(index, 'bio', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Présentez l'expertise et l'expérience de ce membre..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
