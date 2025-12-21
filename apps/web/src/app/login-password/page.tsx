'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function PasswordLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/check-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Rediriger vers la page demandÃ©e ou la page d'accueil
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      } else {
        setError(data.error || 'Mot de passe incorrect');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez rÃ©essayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AccÃ¨s ProtÃ©gÃ©
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Veuillez entrer le mot de passe pour accÃ©der Ã  l'application
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez le mot de passe"
            required
            fullWidth
            error={error}
            autoFocus
          />

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading || !password}
          >
            {loading ? 'VÃ©rification...' : 'Se connecter'}
          </Button>
        </form>
      </Card>
    </div>
  );
}