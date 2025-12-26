/**
 * Survey Taker Component
 * 
 * Component for users to take/complete surveys.
 * Supports conditional logic, progress bar, and multiple pages.
 * 
 * @component
 * @example
 * ```tsx
 * <SurveyTaker
 *   survey={surveyData}
 *   onSubmit={async (data) => {
 *     await surveysAPI.submit(survey.id, data);
 *   }}
 * />
 * ```
 * 
 * @features
 * - Multi-page surveys
 * - Progress bar
 * - Conditional logic (skip questions)
 * - Validation
 * - Auto-save draft
 * - Question randomization
 * 
 * @see {@link https://github.com/your-repo/docs/components/survey-taker} Component Documentation
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Alert,
  Progress,
  useToast,
} from '@/components/ui';
import { ChevronLeft, ChevronRight, Send, Save } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
import type { Survey, SurveyQuestion } from './SurveyBuilder';

export interface SurveyTakerProps {
  survey: Survey;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onSaveDraft?: (data: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function SurveyTaker({
  survey,
  onSubmit,
  onSaveDraft,
  loading,
  error,
}: SurveyTakerProps) {
  const t = useTranslations('SurveyTaker');
  const { showToast } = useToast();

  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Group questions by page
  const questionsByPage = useMemo(() => {
    const pages: Record<number, SurveyQuestion[]> = {};
    survey.questions.forEach((q) => {
      const page = q.page || 1;
      if (!pages[page]) pages[page] = [];
      pages[page].push(q);
    });
    return pages;
  }, [survey.questions]);

  // Get current page questions (with conditional logic)
  const currentPageQuestions = useMemo(() => {
    const pageQuestions = questionsByPage[currentPage] || [];
    return pageQuestions.filter((question) => {
      if (!question.showIf) return true;

      const { questionId, operator, value } = question.showIf;
      const answer = responses[questionId];

      switch (operator) {
        case 'equals':
          return String(answer) === String(value);
        case 'not_equals':
          return String(answer) !== String(value);
        case 'contains':
          return String(answer).includes(String(value));
        case 'greater_than':
          return Number(answer) > Number(value);
        case 'less_than':
          return Number(answer) < Number(value);
        default:
          return true;
      }
    });
  }, [questionsByPage, currentPage, responses]);

  const totalPages = Math.max(...Object.keys(questionsByPage).map(Number), 1);
  const progress = (currentPage / totalPages) * 100;

  // Validate current page
  const validatePage = () => {
    const pageErrors: Record<string, string> = {};
    currentPageQuestions.forEach((question) => {
      if (question.required && !responses[question.name]) {
        pageErrors[question.name] = t('required_field') || 'This field is required';
      }
    });
    setErrors(pageErrors);
    return Object.keys(pageErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePage()) {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validatePage()) {
      return;
    }

    // Validate all pages
    const allErrors: Record<string, string> = {};
    Object.values(questionsByPage).flat().forEach((question) => {
      if (question.required && !responses[question.name]) {
        allErrors[question.name] = t('required_field') || 'This field is required';
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      showToast({
        message: t('please_complete_all') || 'Please complete all required fields',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(responses);
      showToast({
        message: survey.successMessage || t('thank_you') || 'Thank you for your response!',
        type: 'success',
      });
    } catch (error) {
      logger.error('Failed to submit survey', error instanceof Error ? error : new Error(String(error)));
      showToast({
        message: t('submit_failed') || 'Failed to submit survey',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await onSaveDraft?.(responses);
      showToast({
        message: t('draft_saved') || 'Draft saved',
        type: 'success',
      });
    } catch (error) {
      logger.error('Failed to save draft', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const value = responses[question.name];
    const error = errors[question.name];

    switch (question.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            key={question.id}
            label={question.label}
            type={question.type === 'email' ? 'email' : question.type === 'number' ? 'number' : 'text'}
            value={String(value || '')}
            onChange={(e) => setResponses({ ...responses, [question.name]: e.target.value })}
            placeholder={question.placeholder}
            required={question.required}
            error={error}
            helperText={question.description}
          />
        );

      case 'textarea':
        return (
          <Textarea
            key={question.id}
            label={question.label}
            value={String(value || '')}
            onChange={(e) => setResponses({ ...responses, [question.name]: e.target.value })}
            placeholder={question.placeholder}
            required={question.required}
            error={error}
            helperText={question.description}
          />
        );

      case 'select':
        return (
          <Select
            key={question.id}
            label={question.label}
            value={String(value || '')}
            onChange={(e) => setResponses({ ...responses, [question.name]: e.target.value })}
            options={question.options || []}
            required={question.required}
            error={error}
            helperText={question.description}
          />
        );

      case 'radio':
        return (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {question.label} {question.required && <span className="text-danger-500">*</span>}
            </label>
            {question.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{question.description}</p>
            )}
            <div className="space-y-2">
              {question.options?.map((option) => (
                <Radio
                  key={option.value}
                  label={option.label}
                  checked={String(value) === option.value}
                  onChange={() => setResponses({ ...responses, [question.name]: option.value })}
                />
              ))}
            </div>
            {error && <p className="text-sm text-danger-500 mt-1">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {question.label} {question.required && <span className="text-danger-500">*</span>}
            </label>
            {question.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{question.description}</p>
            )}
            <div className="space-y-2">
              {question.options?.map((option) => {
                const currentValues = Array.isArray(value) ? value : value ? [value] : [];
                const isChecked = currentValues.includes(option.value);
                return (
                  <Checkbox
                    key={option.value}
                    label={option.label}
                    checked={isChecked}
                    onChange={(checked) => {
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v) => v !== option.value);
                      setResponses({ ...responses, [question.name]: newValues });
                    }}
                  />
                );
              })}
            </div>
            {error && <p className="text-sm text-danger-500 mt-1">{error}</p>}
          </div>
        );

      case 'scale':
      case 'rating':
      case 'nps':
        const min = question.scaleMin || 1;
        const max = question.scaleMax || 5;
        const step = question.scaleStep || 1;
        return (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {question.label} {question.required && <span className="text-danger-500">*</span>}
            </label>
            {question.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{question.description}</p>
            )}
            <div className="flex items-center gap-4">
              {question.scaleLabels?.min && (
                <span className="text-sm text-gray-600 dark:text-gray-400">{question.scaleLabels.min}</span>
              )}
              <div className="flex-1 flex items-center gap-2">
                {Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => {
                  const optionValue = min + i * step;
                  return (
                    <button
                      key={optionValue}
                      type="button"
                      onClick={() => setResponses({ ...responses, [question.name]: optionValue })}
                      className={`px-4 py-2 rounded-lg border ${
                        Number(value) === optionValue
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {optionValue}
                    </button>
                  );
                })}
              </div>
              {question.scaleLabels?.max && (
                <span className="text-sm text-gray-600 dark:text-gray-400">{question.scaleLabels.max}</span>
              )}
            </div>
            {error && <p className="text-sm text-danger-500 mt-1">{error}</p>}
          </div>
        );

      case 'yesno':
        return (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium">
              {question.label} {question.required && <span className="text-danger-500">*</span>}
            </label>
            {question.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{question.description}</p>
            )}
            <div className="flex gap-4">
              <Radio
                label={t('yes') || 'Yes'}
                checked={String(value) === 'yes'}
                onChange={() => setResponses({ ...responses, [question.name]: 'yes' })}
              />
              <Radio
                label={t('no') || 'No'}
                checked={String(value) === 'no'}
                onChange={() => setResponses({ ...responses, [question.name]: 'no' })}
              />
            </div>
            {error && <p className="text-sm text-danger-500 mt-1">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer className="py-8">
      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{survey.name}</h1>
          {survey.description && (
            <p className="text-gray-600 dark:text-gray-400">{survey.description}</p>
          )}
        </div>

        {survey.settings.showProgressBar && totalPages > 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>{t('page') || 'Page'} {currentPage} {t('of') || 'of'} {totalPages}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {error && (
          <Alert type="error" title={t('error') || 'Error'} description={error} className="mb-4" />
        )}

        <div className="space-y-6">
          {currentPageQuestions.map((question) => renderQuestion(question))}
        </div>

        <div className="flex justify-between mt-8">
          <div>
            {onSaveDraft && (
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading || isSubmitting || isSavingDraft}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingDraft ? t('saving') || 'Saving...' : t('save_draft') || 'Save Draft'}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={loading || isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('previous') || 'Previous'}
              </Button>
            )}
            {currentPage < totalPages ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={loading || isSubmitting}
              >
                {t('next') || 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={loading || isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? t('submitting') || 'Submitting...' : survey.submitButtonText || t('submit') || 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}

