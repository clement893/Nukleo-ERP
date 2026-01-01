'use client';

import { SubmissionWizardData } from '../SubmissionWizard';
import { Company } from '@/lib/api/companies';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Building2 } from 'lucide-react';

interface CoverPageProps {
  data: SubmissionWizardData;
  companies: Company[];
  loadingCompanies: boolean;
  onChange: (updates: Partial<SubmissionWizardData>) => void;
}

export default function SubmissionCoverPage({
  data,
  companies,
  loadingCompanies,
  onChange,
}: CoverPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Page couverture</h2>
        <p className="text-muted-foreground">
          Remplissez les informations de base pour la page couverture de votre soumission
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Titre principal *"
          value={data.coverTitle}
          onChange={(e) => onChange({ coverTitle: e.target.value })}
          required
          fullWidth
          placeholder="Ex: Proposition de services"
        />
        
        <Input
          label="Sous-titre"
          value={data.coverSubtitle}
          onChange={(e) => onChange({ coverSubtitle: e.target.value })}
          fullWidth
          placeholder="Ex: Pour [Nom du projet]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          <Building2 className="w-4 h-4 inline mr-1.5" />
          Client *
        </label>
        <Select
          value={data.companyId?.toString() || ''}
          onChange={(e) => {
            const companyId = e.target.value ? parseInt(e.target.value) : null;
            const company = companies.find(c => c.id === companyId);
            onChange({
              companyId,
              coverClient: company?.name || '',
              coverCompany: company?.name || '',
            });
          }}
          options={[
            { value: '', label: loadingCompanies ? 'Chargement...' : 'Sélectionner un client' },
            ...companies.map(c => ({ value: c.id.toString(), label: c.name })),
          ]}
          fullWidth
          disabled={loadingCompanies || companies.length === 0}
        />
        {loadingCompanies && (
          <p className="text-xs text-muted-foreground mt-1">Chargement des clients...</p>
        )}
        {!loadingCompanies && companies.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">Aucun client disponible</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nom du client"
          value={data.coverClient}
          onChange={(e) => onChange({ coverClient: e.target.value })}
          fullWidth
          placeholder="Nom du contact client"
        />
        
        <Input
          label="Date"
          type="date"
          value={data.coverDate}
          onChange={(e) => onChange({ coverDate: e.target.value })}
          fullWidth
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground">
          Type de soumission
        </label>
        <Select
          value={data.type || ''}
          onChange={(e) => onChange({ type: e.target.value })}
          options={[
            { value: '', label: 'Sélectionner un type' },
            { value: 'rfp', label: 'RFP (Request for Proposal)' },
            { value: 'tender', label: 'Appel d\'offres' },
            { value: 'proposal', label: 'Proposition' },
            { value: 'other', label: 'Autre' },
          ]}
          fullWidth
        />
      </div>

      <Input
        label="Date limite"
        type="date"
        value={data.deadline || ''}
        onChange={(e) => onChange({ deadline: e.target.value || null })}
        fullWidth
      />
    </div>
  );
}
