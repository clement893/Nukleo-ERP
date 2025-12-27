'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';

const themes = [
  { id: 'light', name: 'Clair', description: 'Thème clair par défaut' },
  { id: 'dark', name: 'Sombre', description: 'Thème sombre' },
  { id: 'system', name: 'Système', description: 'Suivre les préférences du système' },
];

export default function AdminThemeContent() {
  const [selectedTheme, setSelectedTheme] = useState('system');

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Gestion des Thèmes
        </h1>
        <p className="text-muted-foreground">
          Configurez les thèmes disponibles pour la plateforme
        </p>
      </div>

      <Card className="mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Thème Actuel</h2>
          <div className="flex items-center gap-4">
            <ThemeToggleWithIcon />
            <span className="text-sm text-muted-foreground">
              Basculer entre clair et sombre
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Thèmes Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedTheme === theme.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-border hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedTheme(theme.id)}
            >
              <h3 className="font-semibold mb-1">{theme.name}</h3>
              <p className="text-sm text-muted-foreground">
                {theme.description}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </Container>
  );
}

