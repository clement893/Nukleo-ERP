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
  mode?: 'modal' | 'page'; // Nouveau prop pour le mode
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
  mode = 'modal', // Par défaut modal pour rétrocompatibilité
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Sauvegarde automatique du brouillon (uniquement en mode page)
  useEffect(() => {
    if (mode !== 'page' || !onSaveDraft) return;

    const AUTO_SAVE_INTERVAL = 30000; // 30 secondes
    const STORAGE_KEY = 'submission_wizard_draft';

    // Sauvegarder dans localStorage à chaque changement
    const saveToLocalStorage = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          data: formData,
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        // Ignorer les erreurs de localStorage (quota, etc.)
      }
    };

    // Sauvegarder automatiquement toutes les 30 secondes
    const autoSaveInterval = setInterval(() => {
      // Ne sauvegarder que si au moins un champ est rempli
      if (formData.coverTitle || formData.context || formData.introduction) {
        saveToLocalStorage();
      }
    }, AUTO_SAVE_INTERVAL);

    // Sauvegarder immédiatement lors des changements (debounced)
    const timeoutId = setTimeout(() => {
      if (formData.coverTitle || formData.context || formData.introduction) {
        saveToLocalStorage();
      }
    }, 2000); // Attendre 2 secondes après le dernier changement

    return () => {
      clearInterval(autoSaveInterval);
      clearTimeout(timeoutId);
    };
  }, [formData, mode, onSaveDraft]);

  // Restaurer le brouillon depuis localStorage au montage (uniquement en mode page)
  useEffect(() => {
    if (mode !== 'page' || initialData) return; // Ne pas restaurer si on a déjà des données initiales

    try {
      const STORAGE_KEY = 'submission_wizard_draft';
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Vérifier que les données ne sont pas trop anciennes (max 7 jours)
        const savedDate = new Date(parsed.timestamp);
        const daysDiff = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff < 7 && parsed.data) {
          setFormData(parsed.data);
          showToast({
            message: 'Brouillon restauré automatiquement',
            type: 'info',
          });
        } else {
          // Supprimer les données trop anciennes
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      // Ignorer les erreurs de parsing
    }
  }, [mode, initialData, showToast]);

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
      
      // Nettoyer le localStorage après sauvegarde réussie
      if (mode === 'page') {
        try {
          localStorage.removeItem('submission_wizard_draft');
        } catch (error) {
          // Ignorer les erreurs
        }
      }
      
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
    
    // Nettoyer le localStorage après création réussie
    if (mode === 'page') {
      try {
        localStorage.removeItem('submission_wizard_draft');
      } catch (error) {
        // Ignorer les erreurs
      }
    }
    
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

  const isPageMode = mode === 'page';

  return (
    <div className={`w-full flex flex-col ${isPageMode ? 'h-full' : 'space-y-6'}`}>
      {/* Progress Steps */}
      <div className={`flex items-center justify-between border-b border-border pb-4 flex-shrink-0 ${
        isPageMode ? 'mb-6' : ''
      } overflow-x-auto`}>
        <div className="flex items-center w-full min-w-max flex-1">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div 
                  className="flex flex-col items-center cursor-pointer group px-1"
                  onClick={() => goToStep(index)}
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? 'border-primary bg-primary text-white'
                        : isCompleted
                        ? 'border-primary bg-primary text-white group-hover:scale-110'
                        : 'border-border bg-background text-muted-foreground group-hover:border-primary group-hover:bg-primary/10'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs text-center transition-colors whitespace-nowrap ${
                      isActive ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-primary'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 sm:mx-2 min-w-[20px] ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        
      </div>

      {/* Main Content Area - Layout différent selon le mode */}
      {isPageMode ? (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
          {/* Step Content - Zone principale */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-0 lg:pr-4">
              {renderStep()}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Step Content */}
          <div className="min-h-[400px] flex-1 overflow-y-auto">
            {renderStep()}
          </div>
        </>
      )}

      {/* Navigation */}
      <div className={`flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 pt-4 border-t border-border relative z-10 bg-background flex-shrink-0 ${
        isPageMode ? 'mt-6' : ''
      }`}>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? onCancel : prevStep}
            disabled={loading}
            className="flex-1 sm:flex-initial"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              <Save className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sauvegarder le brouillon</span>
              <span className="sm:hidden">Brouillon</span>
            </Button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className="flex-1 sm:flex-initial"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              loading={loading}
              className="flex-1 sm:flex-initial"
            >
              Créer la soumission
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
