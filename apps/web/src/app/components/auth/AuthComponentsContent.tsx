'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import MFA from '@/components/auth/MFA';
import SocialAuth from '@/components/auth/SocialAuth';
import type { SocialProvider } from '@/components/auth/SocialAuth';
import Card from '@/components/ui/Card';
import { logger } from '@/lib/logger';

export default function AuthComponentsContent() {
  const handleMFAVerify = async (code: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info('MFA Code verified', { code });
    // In real app, this would call your API
  };

  const handleSocialSignIn = (provider: SocialProvider) => {
    logger.info('Social sign in', { provider });
    // In real app, this would redirect to OAuth provider
  };

  return (
    <PageContainer>
      <PageHeader
        title="Composants d'Authentification"
        description="Composants pour l'authentification multi-facteurs et l'authentification sociale"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Authentification' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Multi-Factor Authentication (MFA)">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Vérification MFA
              </h3>
              <div className="max-w-md">
                <MFA
                  onVerify={handleMFAVerify}
                  email="user@example.com"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Configuration MFA avec QR Code
              </h3>
              <div className="max-w-md">
                <MFA
                  onVerify={handleMFAVerify}
                  email="user@example.com"
                  // Note: In production, qrCodeUrl and secret should come from your API
                  // Never hardcode secrets in production code
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Authentification Sociale">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tous les fournisseurs
              </h3>
              <div className="max-w-md">
                <Card className="p-6">
                  <SocialAuth
                    providers={['google', 'github', 'microsoft']}
                    onSignIn={handleSocialSignIn}
                    fullWidth
                  />
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Google uniquement
              </h3>
              <div className="max-w-md">
                <Card className="p-6">
                  <SocialAuth
                    providers={['google']}
                    onSignIn={handleSocialSignIn}
                    fullWidth
                  />
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                GitHub uniquement
              </h3>
              <div className="max-w-md">
                <Card className="p-6">
                  <SocialAuth
                    providers={['github']}
                    onSignIn={handleSocialSignIn}
                    fullWidth
                  />
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Microsoft uniquement
              </h3>
              <div className="max-w-md">
                <Card className="p-6">
                  <SocialAuth
                    providers={['microsoft']}
                    onSignIn={handleSocialSignIn}
                    fullWidth
                  />
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Google et GitHub
              </h3>
              <div className="max-w-md">
                <Card className="p-6">
                  <SocialAuth
                    providers={['google', 'github']}
                    onSignIn={handleSocialSignIn}
                    fullWidth
                  />
                </Card>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Exemple d'intégration complète">
          <div className="max-w-md">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Connexion à votre compte
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Utilisez votre compte social ou votre email pour vous connecter
              </p>
              <SocialAuth
                providers={['google', 'github', 'microsoft']}
                onSignIn={handleSocialSignIn}
                fullWidth
              />
            </Card>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

