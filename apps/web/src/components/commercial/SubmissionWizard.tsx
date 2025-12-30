'use client';

import { useState, useEffect } from 'react';
import { SubmissionCreate, Submission, submissionsAPI } from '@/lib/api/submissions';
import { Company } from '@/lib/api/companies';
import { companiesAPI } from '@/lib/api/companies';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { ChevronLeft, ChevronRight, Check, FileText } from 'lucide-react';
import SubmissionCoverPage from './submission/CoverPage';
import SubmissionContext from './submission/Context';
import SubmissionIntroduction from './submission/Introduction';
import SubmissionMandate from './submission/Mandate';
import SubmissionProcess from './submission/Process';
import SubmissionBudget from './submission/Budget';
import SubmissionTeam from './submission/Team';

export interface SubmissionWizardData {
  // Cover Page
  coverTitle: string;
  coverSubtitle: string;
  coverDate: string;
  coverClient: string;
  coverCompany: string;
  
  // Context
  context: string;
  
  // Introduction
  introduction: string;
  
  // Mandate
  mandate: string;
  objectives: string[];
  
  // Process
  processSteps: Array<{
    title: string;
    description: string;
    duration?: string;
  }>;
  
  // Budget
  budgetItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  budgetTotal: number;
  currency: string;
  
  // Team
  teamMembers: Array<{
    name: string;
    role: string;
    bio: string;
    photo?: string;
  }>;
  
  // Metadata
  companyId: number | null;
  type: string;
  deadline: string | null;
}

interface SubmissionWizardProps {
  onSubmit: (data: SubmissionCreate) => Promise<Submission | void>;
  onCancel: () => void;
  loading?: boolean;
}

const STEPS = [
  { id: 'cover', label: 'Page couverture', icon: FileText },
  { id: 'context', label: 'Contexte', icon: FileText },
  { id: 'introduction', label: 'Introduction', icon: FileText },
  { id: 'mandate', label: 'Mandat', icon: FileText },
  { id: 'process', label: 'Processus', icon: FileText },
  { id: 'budget', label: 'Budget', icon: FileText },
  { id: 'team', label: 'Équipe', icon: FileText },
];

export default function SubmissionWizard({
  onSubmit,
  onCancel,
  loading = false,
}: SubmissionWizardProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  const [formData, setFormData] = useState<SubmissionWizardData>({
    coverTitle: '',
    coverSubtitle: '',
    coverDate: new Date().toISOString().split('T')[0] || '',
    coverClient: '',
    coverCompany: '',
    context: '',
    introduction: '',
    mandate: '',
    objectives: [],
    processSteps: [],
    budgetItems: [],
    budgetTotal: 0,
    currency: 'EUR',
    teamMembers: [],
    companyId: null,
    type: '',
    deadline: null,
  });

  // Load companies
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const data = await companiesAPI.list(0, 1000);
        setCompanies(data);
      } catch (error) {
        showToast({
          message: 'Erreur lors du chargement des entreprises',
          type: 'error',
        });
      } finally {
        setLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, [showToast]);

  const updateFormData = (updates: Partial<SubmissionWizardData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.coverTitle || !formData.companyId) {
      showToast({
        message: 'Veuillez remplir tous les champs obligatoires',
        type: 'error',
      });
      return;
    }

    // Prepare submission data
    const submissionData: SubmissionCreate = {
      title: formData.coverTitle,
      company_id: formData.companyId,
      type: formData.type || 'proposal',
      description: formData.introduction,
      content: {
        cover: {
          title: formData.coverTitle,
          subtitle: formData.coverSubtitle,
          date: formData.coverDate,
          client: formData.coverClient,
          company: formData.coverCompany,
        },
        context: formData.context,
        introduction: formData.introduction,
        mandate: {
          description: formData.mandate,
          objectives: formData.objectives,
        },
        process: formData.processSteps,
        budget: {
          items: formData.budgetItems,
          total: formData.budgetTotal,
          currency: formData.currency,
        },
        team: formData.teamMembers,
      },
      status: 'draft',
      deadline: formData.deadline,
    };

    const createdSubmission = await onSubmit(submissionData);
    
    // Offer to download PDF after creation
    if (createdSubmission && 'id' in createdSubmission) {
      try {
        await submissionsAPI.generatePDF((createdSubmission as any).id);
        showToast({
          message: 'PDF généré avec succès',
          type: 'success',
        });
      } catch (error) {
        showToast({
          message: 'Erreur lors de la génération du PDF',
          type: 'error',
        });
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <SubmissionCoverPage
            data={formData}
            companies={companies}
            loadingCompanies={loadingCompanies}
            onChange={updateFormData}
          />
        );
      case 1:
        return (
          <SubmissionContext
            data={formData}
            onChange={updateFormData}
          />
        );
      case 2:
        return (
          <SubmissionIntroduction
            data={formData}
            onChange={updateFormData}
          />
        );
      case 3:
        return (
          <SubmissionMandate
            data={formData}
            onChange={updateFormData}
          />
        );
      case 4:
        return (
          <SubmissionProcess
            data={formData}
            onChange={updateFormData}
          />
        );
      case 5:
        return (
          <SubmissionBudget
            data={formData}
            onChange={updateFormData}
          />
        );
      case 6:
        return (
          <SubmissionTeam
            data={formData}
            onChange={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : isCompleted
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs text-center ${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    isCompleted ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 0 ? onCancel : prevStep}
          disabled={loading}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 0 ? 'Annuler' : 'Précédent'}
        </Button>
        
        <div className="flex gap-2">
          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={loading}
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              loading={loading}
            >
              Créer la soumission
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
