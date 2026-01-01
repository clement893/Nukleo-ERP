'use client';

import { useState, useEffect } from 'react';
import { SubmissionCreate, Submission, submissionsAPI } from '@/lib/api/submissions';
import { Company } from '@/lib/api/companies';
import { companiesAPI } from '@/lib/api/companies';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { ChevronLeft, ChevronRight, Check, FileText, Save } from 'lucide-react';
import SubmissionCoverPage from './submission/CoverPage';
import SubmissionContext from './submission/Context';
import SubmissionIntroduction from './submission/Introduction';
import SubmissionMandate from './submission/Mandate';
import SubmissionProcess from './submission/Process';
import SubmissionBudget from './submission/Budget';
import SubmissionTeam from './submission/Team';
import { LeoAssistant } from './LeoAssistant';

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
  onSaveDraft?: (data: SubmissionCreate) => Promise<Submission | void>;
  loading?: boolean;
  initialData?: SubmissionWizardData;
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
  onSaveDraft,
  loading = false,
  initialData,
}: SubmissionWizardProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  const [formData, setFormData] = useState<SubmissionWizardData>(initialData || {
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

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Load companies immediately when component mounts
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

  // Get current step context for Leo
  const getStepContext = () => {
    const stepNames = ['Page couverture', 'Contexte', 'Introduction', 'Mandat', 'Processus', 'Budget', 'Équipe'];
    const currentStepName = stepNames[currentStep] || '';
    const companyName = companies.find(c => c.id === formData.companyId)?.name || formData.coverClient || '';
    return `Étape actuelle : ${currentStepName}${companyName ? ` - Client : ${companyName}` : ''}${formData.coverTitle ? ` - Titre : ${formData.coverTitle}` : ''}`;
  };
  
  // Handle text generation from Leo
  const handleTextGenerated = (text: string) => {
    const stepNames = ['cover', 'context', 'introduction', 'mandate', 'process', 'budget', 'team'];
    const currentStepName = stepNames[currentStep];
    
    switch (currentStepName) {
      case 'cover':
        if (!formData.coverTitle) {
          updateFormData({ coverTitle: text });
        } else if (!formData.coverSubtitle) {
          updateFormData({ coverSubtitle: text });
        }
        break;
      case 'context':
        updateFormData({ context: text });
        break;
      case 'introduction':
        updateFormData({ introduction: text });
        break;
      case 'mandate':
        updateFormData({ mandate: text });
        break;
      case 'process':
        // For process, we might want to parse the text into steps
        // For now, just update the first step if empty
        if (formData.processSteps.length === 0 || !formData.processSteps[0]?.description) {
          const steps = text.split('\n').filter(line => line.trim()).map((line, index) => ({
            title: `Étape ${index + 1}`,
            description: line.trim(),
          }));
          if (steps.length > 0) {
            updateFormData({ processSteps: steps });
          }
        }
        break;
      default:
        // For other steps, try to update the appropriate field
        break;
    }
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

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex);
    }
  };

  const generateSubmissionNumber = (): string => {
    // Generate a temporary submission number
    // Format: SUB-YYYYMMDD-HHMMSS or SUB-DRAFT-{timestamp}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `SUB-${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  const prepareSubmissionData = (): SubmissionCreate => {
    return {
      submission_number: generateSubmissionNumber(),
      title: formData.coverTitle || 'Brouillon sans titre',
      company_id: formData.companyId || null,
      type: formData.type || 'proposal',
      description: formData.introduction || null,
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
      deadline: formData.deadline || null,
    };
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) {
      showToast({
        message: 'La sauvegarde de brouillon n\'est pas disponible',
        type: 'error',
      });
      return;
    }

    try {
      const submissionData = prepareSubmissionData();
      await onSaveDraft(submissionData);
      showToast({
        message: 'Brouillon sauvegardé avec succès',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Erreur lors de la sauvegarde du brouillon',
        type: 'error',
      });
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    const missingFields: string[] = [];
    
    if (!formData.coverTitle || formData.coverTitle.trim() === '') {
      missingFields.push('Titre principal');
    }
    
    if (!formData.companyId) {
      missingFields.push('Client');
    }
    
    if (missingFields.length > 0) {
      // Navigate to cover page if missing fields are there
      if (!formData.coverTitle || !formData.companyId) {
        setCurrentStep(0);
      }
      
      const fieldsList = missingFields.join(', ');
      showToast({
        message: `Veuillez remplir les champs obligatoires suivants : ${fieldsList}`,
        type: 'error',
      });
      return;
    }

    // Prepare submission data
    const submissionData = prepareSubmissionData();
    submissionData.status = 'draft'; // Keep as draft initially

    const createdSubmission = await onSubmit(submissionData);
    
    // Offer to download PDF after creation
    if (createdSubmission && typeof createdSubmission === 'object' && 'id' in createdSubmission) {
      try {
        const submissionId = (createdSubmission as Submission).id;
        await submissionsAPI.generatePDF(submissionId);
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
    <div className="space-y-6 w-full flex flex-col h-full">
      {/* Progress Steps */}
      <div className="flex items-center justify-between border-b border-border pb-4 flex-shrink-0">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div 
                className="flex flex-col items-center flex-1 cursor-pointer group"
                onClick={() => goToStep(index)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : isCompleted
                      ? 'border-primary bg-primary text-white group-hover:scale-110'
                      : 'border-border bg-background text-muted-foreground group-hover:border-primary group-hover:bg-primary/10'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs text-center transition-colors ${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'
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
      <div className="min-h-[400px] flex-1 overflow-y-auto">
        {renderStep()}
      </div>

      {/* Leo Assistant */}
      <div className="flex-shrink-0">
        <LeoAssistant
          context={getStepContext()}
          onTextGenerated={handleTextGenerated}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border relative z-10 bg-background flex-shrink-0">
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
          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder le brouillon
            </Button>
          )}
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
