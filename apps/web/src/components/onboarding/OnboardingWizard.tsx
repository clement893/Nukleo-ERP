'use client';

import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';

interface OnboardingStep {
  id: number;
  key: string;
  title: string;
  description?: string;
  order: number;
  step_type: string;
  step_data?: Record<string, any>;
  required: boolean;
}

interface OnboardingWizardProps {
  className?: string;
  onComplete?: () => void;
}

export function OnboardingWizard({ className = '', onComplete }: OnboardingWizardProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Initialize if needed
      await apiClient.post('/api/v1/onboarding/onboarding/initialize');
      
      // Get steps
      const stepsResponse = await apiClient.get<OnboardingStep[]>('/api/v1/onboarding/onboarding/steps');
      if (stepsResponse.data) {
        setSteps(stepsResponse.data);
        
        // Get current step
        const nextStepResponse = await apiClient.get<OnboardingStep | null>('/api/v1/onboarding/onboarding/next-step');
        if (nextStepResponse.data) {
          const currentIndex = stepsResponse.data.findIndex(s => s.key === nextStepResponse.data?.key);
          if (currentIndex >= 0) {
            setCurrentStepIndex(currentIndex);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    setIsCompleting(true);
    try {
      await apiClient.post(`/api/v1/onboarding/onboarding/steps/${currentStep.key}/complete`);
      
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // All steps completed
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error: any) {
      showToast({
        message: error.response?.data?.detail || 'Failed to complete step',
        type: 'error',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep || currentStep.required) return;

    try {
      await apiClient.post(`/api/v1/onboarding/onboarding/steps/${currentStep.key}/skip`);
      
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } catch (error: any) {
      showToast({
        message: error.response?.data?.detail || 'Failed to skip step',
        type: 'error',
      });
    }
  };

  const handleClose = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (isLoading || steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentStepIndex];
  
  if (!currentStep) {
    return null;
  }
  
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Welcome! Let's get started</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{currentStep.title}</h3>
          {currentStep.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{currentStep.description}</p>
          )}
          
          {/* Step-specific content based on step_type */}
          {currentStep.step_type === 'info' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm">This is an informational step. Click "Next" to continue.</p>
            </div>
          )}
          
          {currentStep.step_type === 'form' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Form content would be rendered here based on step_data configuration.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            {!currentStep.required && (
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {currentStepIndex === steps.length - 1 ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

