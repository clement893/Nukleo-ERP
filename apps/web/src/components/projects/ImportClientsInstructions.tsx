'use client';

import { useState } from 'react';
import { X, FileSpreadsheet, Image, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface ImportClientsInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate?: () => void;
}

export default function ImportClientsInstructions({
  isOpen,
  onClose,
  onDownloadTemplate,
}: ImportClientsInstructionsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      // Import dynamically to avoid SSR issues
      const { downloadClientZipTemplate } = await import('@/lib/utils/generateClientTemplate');
      await downloadClientZipTemplate();
      
      if (onDownloadTemplate) {
        onDownloadTemplate();
      }
    } catch (error) {
      console.error('Error downloading template:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Instructions d'import de clients</h2>
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
                <span><strong>Fichier Excel seul</strong> (.xlsx, .xls) - Import simple avec URLs de logos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Fichier ZIP</strong> (.zip) - Contient le fichier Excel + les logos des entreprises</span>
              </li>
            </ul>
          </Card>

          {/* Structure du ZIP */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Structure du fichier ZIP (recommandé)
            </h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-3">
              <div className="text-foreground">clients.zip</div>
              <div className="ml-4 mt-1">
                <div className="text-blue-500">├── clients.xlsx</div>
                <div className="text-blue-500">└── logos/</div>
                <div className="ml-4 text-green-500">
                  ├── acme_corp.jpg
                  <br />
                  ├── tech_solutions.png
                  <br />
                  └── ...
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Fichier Excel:</strong> Doit être nommé <code className="bg-background px-1 py-0.5 rounded">clients.xlsx</code> ou <code className="bg-background px-1 py-0.5 rounded">clients.xls</code></p>
              <p><strong>Dossier logos:</strong> Optionnel, peut être à la racine du ZIP ou dans un dossier <code className="bg-background px-1 py-0.5 rounded">logos/</code></p>
            </div>
          </Card>

          {/* Colonnes Excel */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Colonnes Excel supportées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium mb-2">Informations entreprise (requis):</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>company_name</strong> / nom_entreprise / entreprise *REQUIS*</li>
                  <li>• <strong>company_id</strong> / id_entreprise / entreprise_id</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Informations client:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>status</strong> / statut (actif, inactif, maintenance)</li>
                  <li>• <strong>responsible_employee</strong> / responsable / employé</li>
                  <li>• <strong>responsible_employee_id</strong> / id_responsable / id_employe</li>
                  <li>• <strong>notes</strong> / remarques / commentaires</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Logos:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>logo_url</strong> / logo / url_logo / image_url</li>
                  <li>• <strong>logo_filename</strong> / nom_fichier_logo</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Les noms de colonnes sont insensibles à la casse et aux accents. 
                Par exemple, "Nom Entreprise", "nom_entreprise", "NOM_ENTREPRISE" sont tous acceptés.
              </p>
            </div>
          </Card>

          {/* Matching des entreprises */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Matching automatique des entreprises</h3>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Le système essaiera automatiquement de faire correspondre les entreprises par nom :
              </p>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Correspondance exacte</strong> (insensible à la casse)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Correspondance sans forme juridique</strong> (SARL, SA, SAS, EURL)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Correspondance partielle</strong> (contient ou est contenu)</span>
                </li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Si aucune entreprise correspondante n'est trouvée, une nouvelle entreprise sera créée automatiquement et marquée comme client (<code className="bg-background px-1 py-0.5 rounded">is_client=True</code>).
              </p>
            </div>
          </Card>

          {/* Nommage des logos */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Nommage des logos
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-2">Méthode 1: Nommage automatique</p>
                <p className="text-muted-foreground mb-2">
                  Les logos sont automatiquement associés aux entreprises si elles suivent ce format (nom normalisé):
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                  <div className="text-green-500">nom_entreprise.jpg</div>
                  <div className="text-muted-foreground mt-1">Exemples:</div>
                  <div className="text-foreground">acme_corp.jpg</div>
                  <div className="text-foreground">tech_solutions.png</div>
                  <div className="text-foreground">entreprise_exemple.jpeg</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Les accents, espaces et caractères spéciaux sont automatiquement normalisés. 
                  Formats acceptés: .jpg, .jpeg, .png, .gif, .webp
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Méthode 2: Colonne Excel</p>
                <p className="text-muted-foreground">
                  Ajoutez une colonne <code className="bg-background px-1 py-0.5 rounded">logo_filename</code> ou 
                  <code className="bg-background px-1 py-0.5 rounded">nom_fichier_logo</code> avec le nom exact du fichier logo.
                </p>
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
                    <th className="border p-2 text-left">company_name</th>
                    <th className="border p-2 text-left">status</th>
                    <th className="border p-2 text-left">responsible_employee</th>
                    <th className="border p-2 text-left">logo_filename</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Acme Corp</td>
                    <td className="border p-2">actif</td>
                    <td className="border p-2">Jean Dupont</td>
                    <td className="border p-2">acme_corp.jpg</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Tech Solutions</td>
                    <td className="border p-2">actif</td>
                    <td className="border p-2">Marie Martin</td>
                    <td className="border p-2">tech_solutions.png</td>
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
                <span>Le nom de l'entreprise est <strong>requis</strong>. Si l'entreprise n'existe pas, elle sera créée automatiquement et marquée comme client.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Les logos doivent être dans le ZIP pour être uploadés vers S3. Les URLs externes fonctionnent aussi via la colonne <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">logo_url</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Les entreprises existantes seront automatiquement marquées comme clients (<code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">is_client=True</code>) lors de l'import</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Assurez-vous que S3 est configuré pour que les logos soient uploadés correctement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Les statuts acceptés sont: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">actif</code>, <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">inactif</code>, ou <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">maintenance</code></span>
              </li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleDownloadTemplate}
              variant="primary"
              disabled={downloading}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Téléchargement...' : 'Télécharger le modèle ZIP'}
            </Button>
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
