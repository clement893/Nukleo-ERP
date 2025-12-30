'use client';

import { X, FileSpreadsheet, Image, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface ImportContacts2InstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate?: () => void;
}

export default function ImportContacts2Instructions({
  isOpen,
  onClose,
  onDownloadTemplate,
}: ImportContacts2InstructionsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Instructions d'import de contacts</h2>
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
                <span><strong>Fichier Excel seul</strong> (.xlsx, .xls) - Import simple avec URLs de photos S3</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Fichier ZIP</strong> (.zip) - Contient le fichier Excel + les photos</span>
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
              <div className="text-foreground">contacts.zip</div>
              <div className="ml-4 mt-1">
                <div className="text-blue-500">├── contacts.xlsx</div>
                <div className="text-blue-500">└── photos/</div>
                <div className="ml-4 text-green-500">
                  ├── jean_dupont.jpg
                  <br />
                  ├── marie_martin.png
                  <br />
                  └── ...
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Fichier Excel:</strong> Doit être nommé <code className="bg-background px-1 py-0.5 rounded">contacts.xlsx</code> ou <code className="bg-background px-1 py-0.5 rounded">contacts.xls</code></p>
              <p><strong>Dossier photos:</strong> Optionnel, peut être à la racine du ZIP ou dans un dossier <code className="bg-background px-1 py-0.5 rounded">photos/</code></p>
            </div>
          </Card>

          {/* Colonnes Excel */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Colonnes Excel supportées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium mb-2">Informations principales:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>first_name</strong> / prénom *REQUIS*</li>
                  <li>• <strong>last_name</strong> / nom *REQUIS*</li>
                  <li>• <strong>email</strong> / courriel</li>
                  <li>• <strong>phone</strong> / téléphone</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Entreprise et poste:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>company_id</strong> / id entreprise</li>
                  <li>• <strong>company_name</strong> / compagnie</li>
                  <li>• <strong>position</strong> / poste</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Localisation:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>city</strong> / ville</li>
                  <li>• <strong>country</strong> / pays</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Autres informations:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>circle</strong> / cercle</li>
                  <li>• <strong>linkedin</strong> / linkedin</li>
                  <li>• <strong>birthday</strong> / anniversaire</li>
                  <li>• <strong>language</strong> / langue</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Les noms de colonnes sont insensibles à la casse et aux accents. 
                Par exemple, "Prénom", "prenom", "PRENOM" sont tous acceptés.
              </p>
            </div>
          </Card>

          {/* Nommage des photos */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Nommage des photos
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium mb-2">Méthode 1: Nommage automatique</p>
                <p className="text-muted-foreground mb-2">
                  Les photos sont automatiquement associées aux contacts si elles suivent ce format:
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                  <div className="text-green-500">prénom_nom.jpg</div>
                  <div className="text-muted-foreground mt-1">Exemples:</div>
                  <div className="text-foreground">jean_dupont.jpg</div>
                  <div className="text-foreground">marie_martin.png</div>
                  <div className="text-foreground">pierre_durand.jpeg</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Le nom du contact est normalisé: accents supprimés, espaces remplacés par _, minuscules.
                  Formats acceptés: .jpg, .jpeg, .png, .gif, .webp
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Méthode 2: Colonne Excel (recommandé)</p>
                <p className="text-muted-foreground">
                  Ajoutez une colonne <code className="bg-background px-1 py-0.5 rounded">photo_filename</code> ou 
                  <code className="bg-background px-1 py-0.5 rounded">nom_fichier_photo</code> avec le nom exact du fichier photo.
                  Cette méthode a la priorité la plus élevée et permet un matching précis même si le nom du contact ne correspond pas exactement au nom du fichier.
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Méthode 3: URL S3</p>
                <p className="text-muted-foreground">
                  Indiquez directement l'URL S3 dans la colonne <code className="bg-background px-1 py-0.5 rounded">photo_url</code>.
                  Format: <code className="bg-background px-1 py-0.5 rounded">contacts/photos/jean_dupont.jpg</code> ou URL complète.
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
                    <th className="border p-2 text-left">Prénom</th>
                    <th className="border p-2 text-left">Nom</th>
                    <th className="border p-2 text-left">Courriel</th>
                    <th className="border p-2 text-left">Téléphone</th>
                    <th className="border p-2 text-left">Compagnie</th>
                    <th className="border p-2 text-left">ID Entreprise</th>
                    <th className="border p-2 text-left">Poste</th>
                    <th className="border p-2 text-left">Cercle</th>
                    <th className="border p-2 text-left">Ville</th>
                    <th className="border p-2 text-left">Pays</th>
                    <th className="border p-2 text-left">LinkedIn</th>
                    <th className="border p-2 text-left">Anniversaire</th>
                    <th className="border p-2 text-left">Langue</th>
                    <th className="border p-2 text-left">photo_filename</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Jean</td>
                    <td className="border p-2">Dupont</td>
                    <td className="border p-2">jean.dupont@example.com</td>
                    <td className="border p-2">+33 6 12 34 56 78</td>
                    <td className="border p-2">Acme Corporation</td>
                    <td className="border p-2">1</td>
                    <td className="border p-2">Directeur Commercial</td>
                    <td className="border p-2">client</td>
                    <td className="border p-2">Paris</td>
                    <td className="border p-2">France</td>
                    <td className="border p-2">https://linkedin.com/in/jeandupont</td>
                    <td className="border p-2">1980-05-15</td>
                    <td className="border p-2">fr</td>
                    <td className="border p-2">jean_dupont.jpg</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Marie</td>
                    <td className="border p-2">Martin</td>
                    <td className="border p-2">marie.martin@example.com</td>
                    <td className="border p-2">+33 6 98 76 54 32</td>
                    <td className="border p-2">Tech Solutions</td>
                    <td className="border p-2">2</td>
                    <td className="border p-2">Responsable Marketing</td>
                    <td className="border p-2">prospect</td>
                    <td className="border p-2">Lyon</td>
                    <td className="border p-2">France</td>
                    <td className="border p-2">https://linkedin.com/in/mariemartin</td>
                    <td className="border p-2">1985-08-20</td>
                    <td className="border p-2">fr</td>
                    <td className="border p-2">marie_martin.png</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Format Cercle */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Format "Cercle"</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Les valeurs acceptées pour le cercle du contact:</p>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  <code className="bg-background px-2 py-1 rounded">client</code>
                  <code className="bg-background px-2 py-1 rounded">prospect</code>
                  <code className="bg-background px-2 py-1 rounded">partenaire</code>
                  <code className="bg-background px-2 py-1 rounded">fournisseur</code>
                  <code className="bg-background px-2 py-1 rounded">autre</code>
                </div>
              </div>
            </div>
          </Card>

          {/* Format Anniversaire */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Format "Anniversaire"</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Le format de date accepté est: <strong>YYYY-MM-DD</strong></p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">Exemples:</p>
                <div className="space-y-1">
                  <code className="bg-background px-2 py-1 rounded">1980-05-15</code>
                  <code className="bg-background px-2 py-1 rounded">1990-12-25</code>
                  <code className="bg-background px-2 py-1 rounded">1975-01-01</code>
                </div>
              </div>
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
                <span>Les contacts existants seront <strong>mises à jour</strong> si le prénom et nom correspondent exactement (insensible à la casse)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Les photos doivent être dans le ZIP pour être uploadées vers S3. Les URLs S3 fonctionnent aussi via la colonne <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">photo_url</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>L'ID Entreprise doit correspondre à une entreprise existante dans la base de données</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Assurez-vous que S3 est configuré pour que les photos soient uploadées correctement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Le format de date pour l'anniversaire doit être YYYY-MM-DD (ex: 1980-05-15)</span>
              </li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {onDownloadTemplate && (
              <Button
                onClick={onDownloadTemplate}
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
