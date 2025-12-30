'use client';

import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface ImportOpportunitiesInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate?: () => void;
  onDownloadZipTemplate?: () => void;
}

export default function ImportOpportunitiesInstructions({
  isOpen,
  onClose,
  onDownloadTemplate,
  onDownloadZipTemplate,
}: ImportOpportunitiesInstructionsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Instructions d'import d'opportunités</h2>
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
                <span><strong>Fichier Excel</strong> (.xlsx, .xls) - Import des opportunités</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Fichier ZIP</strong> (.zip) - Contient le fichier Excel avec instructions</span>
              </li>
            </ul>
          </Card>

          {/* Colonnes Excel */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Colonnes Excel supportées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium mb-2 text-red-600 dark:text-red-400">Colonnes requises:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>name</strong> / nom / nom_opportunité</li>
                  <li>• <strong>pipeline_id</strong> / id_pipeline</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Informations principales:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>description</strong> / description_opportunité</li>
                  <li>• <strong>amount</strong> / montant / valeur</li>
                  <li>• <strong>probability</strong> / probabilité / proba</li>
                  <li>• <strong>status</strong> / statut</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Pipeline et stade:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>pipeline_id</strong> / id_pipeline (UUID requis)</li>
                  <li>• <strong>stage_id</strong> / id_stade / id_stage (UUID optionnel)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Relations:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>company_id</strong> / id_entreprise / id_company</li>
                  <li>• <strong>company_name</strong> / nom_entreprise</li>
                  <li>• <strong>contact_id</strong> / id_contact</li>
                  <li>• <strong>contact_ids</strong> / ids_contacts (séparés par virgules)</li>
                  <li>• <strong>assigned_to_id</strong> / id_assigné</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Dates:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>expected_close_date</strong> / date_clôture / date_fermeture</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Format: YYYY-MM-DD (ex: 2024-12-31)</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Les noms de colonnes sont insensibles à la casse et aux accents. 
                Par exemple, "Nom", "nom", "NOM" sont tous acceptés.
              </p>
            </div>
          </Card>

          {/* Statuts acceptés */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Statuts acceptés</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-muted p-2 rounded">
                <strong>open</strong> - Ouverte
              </div>
              <div className="bg-muted p-2 rounded">
                <strong>qualified</strong> - Qualifiée
              </div>
              <div className="bg-muted p-2 rounded">
                <strong>proposal</strong> - Proposition
              </div>
              <div className="bg-muted p-2 rounded">
                <strong>negotiation</strong> - Négociation
              </div>
              <div className="bg-muted p-2 rounded">
                <strong>won</strong> - Gagnée
              </div>
              <div className="bg-muted p-2 rounded">
                <strong>lost</strong> - Perdue
              </div>
              <div className="bg-muted p-2 rounded">
                <strong>cancelled</strong> - Annulée
              </div>
            </div>
          </Card>

          {/* Exemple */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Exemple de fichier Excel</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">name</th>
                    <th className="border p-2 text-left">pipeline_id</th>
                    <th className="border p-2 text-left">company_name</th>
                    <th className="border p-2 text-left">amount</th>
                    <th className="border p-2 text-left">status</th>
                    <th className="border p-2 text-left">expected_close_date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Nouveau projet web</td>
                    <td className="border p-2">c7b4d752-0705-4618-8519-14a756d0fd0f</td>
                    <td className="border p-2">Acme Corp</td>
                    <td className="border p-2">50000</td>
                    <td className="border p-2">open</td>
                    <td className="border p-2">2024-12-31</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Refonte site e-commerce</td>
                    <td className="border p-2">c7b4d752-0705-4618-8519-14a756d0fd0f</td>
                    <td className="border p-2">Tech Solutions</td>
                    <td className="border p-2">75000</td>
                    <td className="border p-2">qualified</td>
                    <td className="border p-2">2025-01-15</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Avertissements */}
          <Card className="p-4 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
              <AlertCircle className="w-5 h-5" />
              Points importants
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Le <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">pipeline_id</code> doit être un UUID valide d'un pipeline existant. Vous pouvez le trouver dans Module Commercial &gt; Pipeline Client</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Le <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">stage_id</code> (si fourni) doit appartenir au pipeline spécifié</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Les entreprises doivent exister dans la base de données avant l'import, ou utiliser <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">company_id</code> si vous connaissez l'ID</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Pour les contacts multiples, utilisez la colonne <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">contact_ids</code> avec des IDs séparés par des virgules (ex: 1,2,3)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Les dates doivent être au format YYYY-MM-DD (ex: 2024-12-31)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Le montant doit être un nombre (sans devise, en euros)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>La probabilité doit être un nombre entre 0 et 100</span>
              </li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {onDownloadTemplate && (
              <Button
                onClick={onDownloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle Excel
              </Button>
            )}
            {onDownloadZipTemplate && (
              <Button
                onClick={onDownloadZipTemplate}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle ZIP
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="ml-auto"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
