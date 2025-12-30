'use client';

import { X, FileSpreadsheet, Image, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface ImportCompaniesInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate?: () => void;
}

export default function ImportCompaniesInstructions({
  isOpen,
  onClose,
  onDownloadTemplate,
}: ImportCompaniesInstructionsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Instructions d'import d'entreprises</h2>
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
                <span><strong>Fichier Excel seul</strong> (.xlsx, .xls) - Import simple avec URLs de logos S3</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Fichier ZIP</strong> (.zip) - Contient le fichier Excel + les logos</span>
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
              <div className="text-foreground">entreprises.zip</div>
              <div className="ml-4 mt-1">
                <div className="text-blue-500">├── entreprises.xlsx</div>
                <div className="text-blue-500">└── logos/</div>
                <div className="ml-4 text-green-500">
                  ├── acme_corporation.jpg
                  <br />
                  ├── tech_solutions.png
                  <br />
                  └── ...
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Fichier Excel:</strong> Doit être nommé <code className="bg-background px-1 py-0.5 rounded">entreprises.xlsx</code> ou <code className="bg-background px-1 py-0.5 rounded">entreprises.xls</code></p>
              <p><strong>Dossier logos:</strong> Optionnel, peut être à la racine du ZIP ou dans un dossier <code className="bg-background px-1 py-0.5 rounded">logos/</code></p>
            </div>
          </Card>

          {/* Colonnes Excel */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Colonnes Excel supportées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium mb-2">Informations principales:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>name</strong> / nom / nom de l'entreprise *REQUIS*</li>
                  <li>• <strong>description</strong> / description</li>
                  <li>• <strong>website</strong> / site web / site internet</li>
                  <li>• <strong>logo_url</strong> / logo / logo url</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Contact:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>email</strong> / courriel / e-mail</li>
                  <li>• <strong>phone</strong> / téléphone / tel</li>
                  <li>• <strong>address</strong> / adresse</li>
                  <li>• <strong>city</strong> / ville</li>
                  <li>• <strong>country</strong> / pays</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Statut et relations:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>is_client</strong> / client / est client</li>
                  <li>• <strong>parent_company_id</strong> / id entreprise parente</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Réseaux sociaux:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>facebook</strong> / facebook_url</li>
                  <li>• <strong>instagram</strong> / instagram_url</li>
                  <li>• <strong>linkedin</strong> / linkedin_url</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Les noms de colonnes sont insensibles à la casse et aux accents. 
                Par exemple, "Nom de l'entreprise", "nom", "NOM" sont tous acceptés.
              </p>
            </div>
          </Card>

          {/* Format Client */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Format "Client (Y/N)"</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Les valeurs acceptées pour indiquer qu'une entreprise est cliente:</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">Valeurs pour "Oui" (client):</p>
                <div className="flex flex-wrap gap-2">
                  <code className="bg-background px-2 py-1 rounded">Oui</code>
                  <code className="bg-background px-2 py-1 rounded">Yes</code>
                  <code className="bg-background px-2 py-1 rounded">True</code>
                  <code className="bg-background px-2 py-1 rounded">1</code>
                  <code className="bg-background px-2 py-1 rounded">Vrai</code>
                  <code className="bg-background px-2 py-1 rounded">O</code>
                </div>
                <p className="font-medium text-foreground mb-1 mt-3">Valeurs pour "Non" (non-client):</p>
                <div className="flex flex-wrap gap-2">
                  <code className="bg-background px-2 py-1 rounded">Non</code>
                  <code className="bg-background px-2 py-1 rounded">No</code>
                  <code className="bg-background px-2 py-1 rounded">False</code>
                  <code className="bg-background px-2 py-1 rounded">0</code>
                  <code className="bg-background px-2 py-1 rounded">Faux</code>
                  <code className="bg-background px-2 py-1 rounded">N</code>
                </div>
              </div>
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
                  Les logos sont automatiquement associés aux entreprises si elles suivent ce format:
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                  <div className="text-green-500">nom_entreprise.jpg</div>
                  <div className="text-muted-foreground mt-1">Exemples:</div>
                  <div className="text-foreground">acme_corporation.jpg</div>
                  <div className="text-foreground">tech_solutions.png</div>
                  <div className="text-foreground">example_company.jpeg</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Le nom de l'entreprise est normalisé: accents supprimés, espaces remplacés par _, minuscules.
                  Formats acceptés: .jpg, .jpeg, .png, .gif, .webp
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Méthode 2: Colonne Excel (recommandé)</p>
                <p className="text-muted-foreground">
                  Ajoutez une colonne <code className="bg-background px-1 py-0.5 rounded">logo_filename</code> ou 
                  <code className="bg-background px-1 py-0.5 rounded">nom_fichier_logo</code> avec le nom exact du fichier logo.
                  Cette méthode a la priorité la plus élevée et permet un matching précis même si le nom de l'entreprise ne correspond pas exactement au nom du fichier.
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Méthode 3: URL S3</p>
                <p className="text-muted-foreground">
                  Indiquez directement l'URL S3 dans la colonne <code className="bg-background px-1 py-0.5 rounded">logo_url</code>.
                  Format: <code className="bg-background px-1 py-0.5 rounded">companies/logos/acme.jpg</code> ou URL complète.
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
                    <th className="border p-2 text-left">Nom de l'entreprise</th>
                    <th className="border p-2 text-left">Site web</th>
                    <th className="border p-2 text-left">Pays</th>
                    <th className="border p-2 text-left">Client (Y/N)</th>
                    <th className="border p-2 text-left">logo_filename</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Acme Corporation</td>
                    <td className="border p-2">https://www.acme.com</td>
                    <td className="border p-2">France</td>
                    <td className="border p-2">Oui</td>
                    <td className="border p-2">acme_corporation.jpg</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Tech Solutions</td>
                    <td className="border p-2">https://tech-solutions.com</td>
                    <td className="border p-2">Canada</td>
                    <td className="border p-2">Non</td>
                    <td className="border p-2">tech_solutions.png</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Entreprises parentes */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Entreprises parentes (filiales)</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Pour créer une filiale, utilisez la colonne <code className="bg-background px-1 py-0.5 rounded">parent_company_id</code> 
                ou <code className="bg-background px-1 py-0.5 rounded">id entreprise parente</code>.
              </p>
              <p>
                <strong>Important:</strong> L'entreprise parente doit exister dans la base de données avant l'import de la filiale.
                Vous pouvez trouver l'ID de l'entreprise parente dans la liste des entreprises.
              </p>
              <div className="bg-muted p-3 rounded-lg mt-2">
                <p className="font-medium text-foreground mb-1">Exemple:</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-background">
                      <th className="border p-1 text-left">Nom de l'entreprise</th>
                      <th className="border p-1 text-left">ID Entreprise parente</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-1">Acme Corporation</td>
                      <td className="border p-1">(vide)</td>
                    </tr>
                    <tr>
                      <td className="border p-1">Acme France</td>
                      <td className="border p-1">1</td>
                    </tr>
                  </tbody>
                </table>
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
                <span>Les entreprises existantes seront <strong>mises à jour</strong> si le nom correspond exactement (insensible à la casse)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Les logos doivent être dans le ZIP pour être uploadés vers S3. Les URLs S3 fonctionnent aussi via la colonne <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">logo_url</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Si <strong>Client (Y/N) = Oui</strong>, l'entreprise sera automatiquement créée dans la liste des clients</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Assurez-vous que S3 est configuré pour que les logos soient uploadés correctement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>L'entreprise parente (pour les filiales) doit exister avant l'import de la filiale</span>
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
