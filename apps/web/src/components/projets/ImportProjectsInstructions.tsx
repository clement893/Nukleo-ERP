'use client';

import { X, FileSpreadsheet, CheckCircle2, Download, Building2, User } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface ImportProjectsInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate?: () => void;
}

export default function ImportProjectsInstructions({
  isOpen,
  onClose,
  onDownloadTemplate,
}: ImportProjectsInstructionsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Instructions d'import de projets</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Format supporté */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Formats supportés
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Fichier Excel</strong> (.xlsx, .xls) - Import simple</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Fichier ZIP</strong> (.zip) - Contient le fichier Excel + documents optionnels</span>
              </li>
            </ul>
          </Card>

          {/* Relations importantes */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Relations importantes
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-2 text-foreground">📌 Projets → Clients</p>
                <p className="text-muted-foreground">
                  Les projets doivent être liés à un <strong>client (entreprise)</strong>. 
                  Vous pouvez utiliser soit l'ID du client (<code className="bg-background px-1 py-0.5 rounded">client_id</code>), 
                  soit le nom du client (<code className="bg-background px-1 py-0.5 rounded">client_name</code>).
                </p>
              </div>
              <div>
                <p className="font-medium mb-2 text-foreground">📌 Projets → Contacts</p>
                <p className="text-muted-foreground">
                  Les projets sont <strong>automatiquement liés aux contacts</strong> du client associé. 
                  Tous les contacts qui appartiennent au même client que le projet seront accessibles via le projet.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 <strong>Note:</strong> Assurez-vous que les clients existent dans le système avant d'importer les projets, 
                  ou créez-les d'abord via l'import de contacts/entreprises.
                </p>
              </div>
            </div>
          </Card>

          {/* Colonnes Excel */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Colonnes Excel supportées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium mb-2">Informations du projet:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>name</strong> / nom / nom du projet *REQUIS*</li>
                  <li>• <strong>description</strong> / desc / descriptif</li>
                  <li>• <strong>status</strong> / statut / état</li>
                  <li className="ml-4 text-xs">(active, archived, completed)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Relations:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>client</strong> / client_name / entreprise / company</li>
                  <li>• <strong>client_id</strong> / id_client / company_id</li>
                  <li>• <strong>responsable</strong> / responsable_name / employee</li>
                  <li>• <strong>responsable_id</strong> / id_responsable / employee_id</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Les noms de colonnes sont insensibles à la casse et aux accents. 
                Par exemple, "Nom", "nom", "NOM" sont tous acceptés.
              </p>
            </div>
          </Card>

          {/* Exemple de structure */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Exemple de structure Excel</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left border-r border-border">name</th>
                    <th className="px-3 py-2 text-left border-r border-border">description</th>
                    <th className="px-3 py-2 text-left border-r border-border">status</th>
                    <th className="px-3 py-2 text-left border-r border-border">client_name</th>
                    <th className="px-3 py-2 text-left">responsable</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border-r border-border">Site web e-commerce</td>
                    <td className="px-3 py-2 border-r border-border">Développement d'un site e-commerce</td>
                    <td className="px-3 py-2 border-r border-border">active</td>
                    <td className="px-3 py-2 border-r border-border">Acme Corp</td>
                    <td className="px-3 py-2">Jean Dupont</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="px-3 py-2 border-r border-border">Application mobile</td>
                    <td className="px-3 py-2 border-r border-border">App iOS et Android</td>
                    <td className="px-3 py-2 border-r border-border">active</td>
                    <td className="px-3 py-2 border-r border-border">TechStart Inc</td>
                    <td className="px-3 py-2">Marie Martin</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Télécharger le modèle */}
          <Card className="p-4 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">Télécharger le modèle</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez le modèle Excel ou ZIP avec les instructions pour faciliter l'import
                </p>
              </div>
              <Button
                onClick={() => {
                  onDownloadTemplate?.();
                }}
                variant="primary"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le modèle
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  );
}
