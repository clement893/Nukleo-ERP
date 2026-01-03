'use client';

/**
 * Management Widget Toolbar
 * Toolbar for managing widgets (add, edit mode, etc.)
 */

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Plus, Edit2, Save, X } from 'lucide-react';
import { useManagementDashboardStore } from '@/lib/management/store';
import { ManagementWidgetLibrary } from './ManagementWidgetLibrary';

export function ManagementWidgetToolbar() {
  const { isEditMode, setEditMode } = useManagementDashboardStore();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6 p-4 glass-card rounded-xl border border-nukleo-lavender/20">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Widgets</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(false)}
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button
                size="sm"
                onClick={() => setIsLibraryOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un widget
              </Button>
            </>
          )}
        </div>
      </div>

      <ManagementWidgetLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />
    </>
  );
}
