'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import { authAPI } from '@/lib/api';
import { employeesAPI } from '@/lib/api/employees';
import { useAuthStore } from '@/lib/store';
import { transformApiUserToStoreUser } from '@/lib/auth/userTransform';
import { Input, Button, Alert, Card, Container } from '@/components/ui';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

function EmployeeLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState('');
  const errorProcessedRef = useRef<string | null>(null);

  // Read error from URL query parameter
  useEffect(() => {
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      // Prevent processing the same error multiple times
      if (errorProcessedRef.current === errorParam) {
        return;
      }
      
      errorProcessedRef.current = errorParam;
      
      let errorMessage = decodeURIComponent(errorParam);
      
      // Translate common error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'unauthorized': 'Votre session a expiré ou vous n\'êtes pas autorisé. Veuillez vous reconnecter.',
        'session_expired': 'Votre session a expiré. Veuillez vous reconnecter.',
        'not_employee': 'Ce compte n\'est pas associé à un employé. Veuillez utiliser le login standard.',
        'forbidden': 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
      };
      
      if (errorMessages[errorParam]) {
        errorMessage = errorMessages[errorParam];
      }
      
      setLocalError(errorMessage);
      setError(errorMessage);
    } else {
      // Clear error if no error param in URL
      if (errorProcessedRef.current !== null) {
        errorProcessedRef.current = null;
        setLocalError('');
        setError(null);
      }
    }
  }, [searchParams, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');

    try {
      const response = await authAPI.login(email, password);
      const { access_token, refresh_token, user } = response.data;

      // Vérifier si l'utilisateur est un employé
      const employee = await employeesAPI.getByUserId(user.id);
      
      if (!employee) {
        setLocalError('Ce compte n\'est pas associé à un employé. Veuillez utiliser le login standard.');
        setError('Ce compte n\'est pas associé à un employé.');
        setIsLoading(false);
        return;
      }

      // Transform user data to store format
      const userForStore = transformApiUserToStoreUser(user);

      // CRITICAL: Wait for token storage to complete before redirecting
      await login(userForStore, access_token, refresh_token);
      
      // Small delay to ensure token is available in sessionStorage for ProtectedRoute
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Rediriger vers le portail employé
      router.push(`/portail-employe/${employee.id}/dashboard`);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.detail || 'Échec de la connexion';
      setLocalError(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5F2B75]/5 via-[#523DC9]/5 to-[#6B1817]/5 dark:from-muted dark:to-muted">
      <Container className="w-full max-w-md">
        <Card className="border border-[#523DC9]/20 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-2xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>N</span>
            </div>
            <h1 className="text-3xl font-black text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Portail Employé
            </h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous à votre espace personnel
            </p>
          </div>

          {error && (
            <Alert variant="error" title="Erreur" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
              fullWidth
            />

            <Input
              type="password"
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              maxLength={128}
              fullWidth
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              className="bg-gradient-to-r from-[#5F2B75] via-[#523DC9] to-[#6B1817] hover:opacity-90 transition-opacity"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Vous n'êtes pas un employé ?{' '}
              <Link href="/auth/login" className="text-[#523DC9] hover:underline font-medium">
                Accéder à la plateforme
              </Link>
            </p>
          </div>
        </Card>
      </Container>
    </main>
  );
}

export default function EmployeeLoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5F2B75]/5 via-[#523DC9]/5 to-[#6B1817]/5 dark:from-muted dark:to-muted">
        <Container className="w-full max-w-md">
          <Card>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#523DC9] mb-4"></div>
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </Card>
        </Container>
      </main>
    }>
      <EmployeeLoginContent />
    </Suspense>
  );
}
