'use client';

import { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { bootstrapSuperAdmin, makeSuperAdmin, checkSuperAdminStatus } from '@/lib/api/admin';
import { Shield, Key, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function BecomeSuperAdminContent() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [bootstrapKey, setBootstrapKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  const handleBootstrap = async () => {
    if (!email || !bootstrapKey) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await bootstrapSuperAdmin(email, bootstrapKey);
      setSuccess(result.message || 'Superadmin créé avec succès !');
      setIsSuperAdmin(true);
      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du superadmin';
      // Check if it's a connection error
      if (errorMessage.includes('backend n\'est pas accessible') || errorMessage.includes('Failed to fetch')) {
        setError(`${errorMessage}. Veuillez démarrer le serveur backend avant de continuer.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMakeSuperAdmin = async () => {
    if (!email) {
      setError('Veuillez entrer un email');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await makeSuperAdmin(email);
      setSuccess(result.message || 'Superadmin créé avec succès !');
      if (email === user?.email) {
        setIsSuperAdmin(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du superadmin';
      // Check if it's a connection error
      if (errorMessage.includes('backend n\'est pas accessible') || errorMessage.includes('Failed to fetch')) {
        setError(`${errorMessage}. Veuillez démarrer le serveur backend avant de continuer.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!email) {
      setError('Veuillez entrer un email');
      return;
    }

    setCheckingStatus(true);
    setError(null);

    try {
      const result = await checkSuperAdminStatus(email);
      setIsSuperAdmin(result.is_superadmin);
      if (result.is_superadmin) {
        setSuccess(`L'utilisateur ${email} est superadmin`);
      } else {
        setError(`L'utilisateur ${email} n'est pas superadmin`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification';
      if (errorMessage.includes('backend n\'est pas accessible') || errorMessage.includes('Failed to fetch')) {
        setError(`${errorMessage}. Veuillez démarrer le serveur backend avant de continuer.`);
      } else {
        setError(errorMessage);
      }
      setIsSuperAdmin(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Devenir Super Admin"
        description="Créez ou vérifiez le statut de superadmin pour un utilisateur"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Super Admin' },
        ]}
      />

      <div className="space-y-8">
        {/* Current User Status */}
        {user && (
          <Section title="Votre Statut Actuel">
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Email:</span>
                  <span className="text-foreground">{user.email}</span>
                </div>
                {isSuperAdmin !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">Statut Superadmin:</span>
                    <Badge variant={isSuperAdmin ? 'success' : 'default'}>
                      {isSuperAdmin ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Superadmin
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Non superadmin
                        </>
                      )}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </Section>
        )}

        {/* Bootstrap Method (First Superadmin) */}
        <Section title="Méthode Bootstrap (Premier Superadmin)">
          <Card>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Créer le premier Superadmin
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Utilisez cette méthode si aucun superadmin n'existe encore dans le système.
                      Vous devez définir la variable d'environnement{' '}
                      <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">BOOTSTRAP_SUPERADMIN_KEY</code>{' '}
                      dans votre backend.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email de l'utilisateur
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Key className="w-4 h-4 inline mr-1" />
                    Clé Bootstrap
                  </label>
                  <Input
                    type="password"
                    value={bootstrapKey}
                    onChange={(e) => setBootstrapKey(e.target.value)}
                    placeholder="Entrez la clé bootstrap"
                  />
                    <p className="mt-1 text-xs text-muted-foreground">
                    Cette clé doit correspondre à la variable{' '}
                    <code>BOOTSTRAP_SUPERADMIN_KEY</code> dans votre backend.
                  </p>
                </div>

                <Button
                  onClick={handleBootstrap}
                  disabled={loading || !email || !bootstrapKey}
                  variant="primary"
                  className="w-full"
                >
                  {loading ? 'Création en cours...' : 'Créer Superadmin (Bootstrap)'}
                </Button>
              </div>
            </div>
          </Card>
        </Section>

        {/* Standard Method (Requires Existing Superadmin) */}
        <Section title="Méthode Standard (Nécessite un Superadmin existant)">
          <Card>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Créer un Superadmin
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Cette méthode nécessite que vous soyez déjà connecté en tant que superadmin.
                      Si vous n'êtes pas encore superadmin, utilisez la méthode Bootstrap ci-dessus.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email de l'utilisateur
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                  />
                </div>

                <Button
                  onClick={handleMakeSuperAdmin}
                  disabled={loading || !email}
                  variant="primary"
                  className="w-full"
                >
                  {loading ? 'Création en cours...' : 'Créer Superadmin'}
                </Button>
              </div>
            </div>
          </Card>
        </Section>

        {/* Check Status */}
        <Section title="Vérifier le Statut">
          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email de l'utilisateur à vérifier
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus || !email}
                    variant="outline"
                  >
                    {checkingStatus ? 'Vérification...' : 'Vérifier'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* Messages */}
        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div>
                <h4 className="font-semibold mb-1 text-red-900 dark:text-red-100">Erreur</h4>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-semibold mb-1 text-green-900 dark:text-green-100">Succès</h4>
                <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Information */}
        <Section title="Informations">
          <Card>
            <div className="space-y-4 text-foreground">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  À propos des Superadmins:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    Les superadmins ont accès à toutes les fonctionnalités administratives
                  </li>
                  <li>
                    La méthode Bootstrap ne fonctionne que s'il n'existe aucun superadmin dans le système
                  </li>
                  <li>
                    Après avoir créé le premier superadmin, vous devez utiliser la méthode standard
                  </li>
                  <li>
                    Assurez-vous que la variable{' '}
                    <code className="bg-muted px-1 rounded">
                      BOOTSTRAP_SUPERADMIN_KEY
                    </code>{' '}
                    est définie dans votre backend
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}

export default function BecomeSuperAdminPage() {
  return <BecomeSuperAdminContent />;
}

