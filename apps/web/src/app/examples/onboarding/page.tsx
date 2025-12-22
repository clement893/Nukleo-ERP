'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ExampleOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
  });

  const steps = [
    { number: 1, title: 'Bienvenue', description: 'Commençons par vous connaître' },
    { number: 2, title: 'Votre Organisation', description: 'Informations sur votre organisation' },
    { number: 3, title: 'Votre Rôle', description: 'Comment allez-vous utiliser la plateforme ?' },
    { number: 4, title: 'Terminé', description: 'Vous êtes prêt à commencer !' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Onboarding completed:', formData);
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <div className="p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        currentStep >= step.number
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                    <div className="mt-2 text-xs text-center text-gray-600 hidden sm:block">
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Bienvenue sur la plateforme !
                </h2>
                <p className="text-gray-600 mb-6">
                  Nous sommes ravis de vous accueillir. Commençons par quelques informations de base.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Votre nom *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Votre email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="jean@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Votre Organisation
                </h2>
                <p className="text-gray-600 mb-6">
                  Parlez-nous de votre organisation.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'organisation *
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Mon Organisation"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Votre Rôle
                </h2>
                <p className="text-gray-600 mb-6">
                  Comment allez-vous utiliser la plateforme ?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Manager', 'Fundraiser', 'Administrator', 'Analyst'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setFormData({ ...formData, role })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.role === role
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{role}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {role === 'Manager' && 'Gérer les équipes et les campagnes'}
                        {role === 'Fundraiser' && 'Collecter des fonds et gérer les donateurs'}
                        {role === 'Administrator' && 'Administrer la plateforme'}
                        {role === 'Analyst' && 'Analyser les données et générer des rapports'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Félicitations !
                </h2>
                <p className="text-gray-600 mb-6">
                  Votre profil est maintenant configuré. Vous êtes prêt à commencer à utiliser la plateforme.
                </p>
                <Button>Commencer</Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          {currentStep < 4 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Précédent
              </Button>
              <Button
                onClick={currentStep === 3 ? handleSubmit : handleNext}
                disabled={
                  (currentStep === 1 && (!formData.name || !formData.email)) ||
                  (currentStep === 2 && !formData.organization) ||
                  (currentStep === 3 && !formData.role)
                }
              >
                {currentStep === 3 ? 'Terminer' : 'Suivant'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
