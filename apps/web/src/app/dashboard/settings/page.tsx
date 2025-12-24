'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Switch from '@/components/ui/Switch';
import { useAuthStore } from '@/lib/store';
import { Save, User, Lock, Bell, Shield } from 'lucide-react';

function SettingsContent() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    securityAlerts: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'private' | 'friends',
    showEmail: true,
    showActivity: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      setError('Le nom et l\'email sont requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!securityData.currentPassword || !securityData.newPassword) {
      setError('Tous les champs de mot de passe sont requis');
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (securityData.newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess('Mot de passe mis à jour avec succès');
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess('Paramètres de notification mis à jour');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess('Paramètres de confidentialité mis à jour');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la confidentialité');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Paramètres
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}

        {/* Profile Settings */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Profil
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gérez vos informations personnelles
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Nom"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Votre nom"
                  fullWidth
                />
              </div>
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="votre@email.com"
                  fullWidth
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleProfileUpdate} loading={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Sécurité
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Modifiez votre mot de passe
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  value={securityData.currentPassword}
                  onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  fullWidth
                />
              </div>
              <div>
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={securityData.newPassword}
                  onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                  placeholder="••••••••"
                  fullWidth
                />
              </div>
              <div>
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={securityData.confirmPassword}
                  onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  fullWidth
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handlePasswordUpdate} loading={loading} variant="danger">
                  <Lock className="w-4 h-4 mr-2" />
                  Changer le mot de passe
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Notifications
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gérez vos préférences de notification
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Notifications par email
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recevoir des notifications importantes par email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onChange={(e) => {
                    setNotifications({ ...notifications, emailNotifications: e.target.checked });
                    handleNotificationsUpdate();
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Notifications push
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recevoir des notifications push dans le navigateur
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNotifications}
                  onChange={(e) => {
                    setNotifications({ ...notifications, pushNotifications: e.target.checked });
                    handleNotificationsUpdate();
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Emails marketing
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recevoir des emails promotionnels et des offres spéciales
                  </p>
                </div>
                <Switch
                  checked={notifications.marketingEmails}
                  onChange={(e) => {
                    setNotifications({ ...notifications, marketingEmails: e.target.checked });
                    handleNotificationsUpdate();
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Alertes de sécurité
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recevoir des alertes pour les activités de sécurité importantes
                  </p>
                </div>
                <Switch
                  checked={notifications.securityAlerts}
                  onChange={(e) => {
                    setNotifications({ ...notifications, securityAlerts: e.target.checked });
                    handleNotificationsUpdate();
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Confidentialité
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contrôlez qui peut voir vos informations
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibilité du profil
                </label>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) =>
                    setPrivacy({
                      ...privacy,
                      profileVisibility: e.target.value as 'public' | 'private' | 'friends',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="public">Public</option>
                  <option value="friends">Amis uniquement</option>
                  <option value="private">Privé</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Afficher l'email
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Permettre aux autres utilisateurs de voir votre email
                  </p>
                </div>
                <Switch
                  checked={privacy.showEmail}
                  onChange={(e) => {
                    setPrivacy({ ...privacy, showEmail: e.target.checked });
                    handlePrivacyUpdate();
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Afficher l'activité
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Permettre aux autres utilisateurs de voir votre activité récente
                  </p>
                </div>
                <Switch
                  checked={privacy.showActivity}
                  onChange={(e) => {
                    setPrivacy({ ...privacy, showActivity: e.target.checked });
                    handlePrivacyUpdate();
                  }}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handlePrivacyUpdate} loading={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

