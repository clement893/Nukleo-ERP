'use client';

import { X, FileSpreadsheet, Image, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface ImportTestimonialsInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate?: () => void;
}

export default function ImportTestimonialsInstructions({
  isOpen,
  onClose,
  onDownloadTemplate,
}: ImportTestimonialsInstructionsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Instructions d'import de témoignages</h2>
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
              <div className="text-foreground">temoignages.zip</div>
              <div className="ml-4 mt-1">
                <div className="text-blue-500">├── temoignages.xlsx</div>
                <div className="text-blue-500">└── logos/</div>
                <div className="ml-4 text-green-500">
                  ├── acme_corp.png
                  <br />
                  ├── tech_company.jpg
                  <br />
                  └── ...
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Fichier Excel:</strong> Doit être nommé <code className="bg-background px-1 py-0.5 rounded">temoignages.xlsx</code> ou <code className="bg-background px-1 py-0.5 rounded">temoignages.xls</code></p>
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
                  <li>• <strong>Entreprise</strong> / company_name : Nom de l'entreprise</li>
                  <li>• <strong>ID Entreprise</strong> / company_id : Identifiant de l'entreprise</li>
                  <li>• <strong>Titre</strong> / title : Titre du témoignage</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Contact:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Prénom Contact</strong> / first_name : Prénom du contact</li>
                  <li>• <strong>Nom Contact</strong> / last_name : Nom du contact</li>
                  <li>• <strong>ID Contact</strong> / contact_id : Identifiant du contact</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Contenu:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Témoignage FR</strong> / testimonial_fr : Témoignage en français</li>
                  <li>• <strong>Témoignage EN</strong> / testimonial_en : Témoignage en anglais</li>
                  <li>• <strong>Langue</strong> / language : Code langue (fr, en)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Logo et publication:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Nom Fichier Logo</strong> / logo_filename : Nom du fichier logo</li>
                  <li>• <strong>URL Logo</strong> / logo_url : URL du logo</li>
                  <li>• <strong>Publié</strong> / is_published : true/false</li>
                  <li>• <strong>Note</strong> / rating : Note de 1 à 5</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Les noms de colonnes sont insensibles à la casse et aux accents. 
                Par exemple, "Entreprise", "entreprise", "ENTREPRISE" sont tous acceptés.
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
                  Les logos sont automatiquement associés aux témoignages si elles suivent ce format:
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                  <div className="text-green-500">nom_entreprise.extension</div>
                  <div className="text-muted-foreground mt-1">Exemples:</div>
                  <div className="text-foreground">acme_corp.png</div>
                  <div className="text-foreground">tech_company.jpg</div>
                  <div className="text-foreground">startup_logo.svg</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Le nom de l'entreprise est normalisé: accents supprimés, espaces remplacés par _, minuscules.
                  Formats acceptés: .jpg, .jpeg, .png, .gif, .webp, .svg
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
                  Format: <code className="bg-background px-1 py-0.5 rounded">testimonials/logos/acme_corp.png</code> ou URL complète.
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
                    <th className="border p-2 text-left">Entreprise</th>
                    <th className="border p-2 text-left">ID Entreprise</th>
                    <th className="border p-2 text-left">Prénom Contact</th>
                    <th className="border p-2 text-left">Nom Contact</th>
                    <th className="border p-2 text-left">Titre</th>
                    <th className="border p-2 text-left">Témoignage FR</th>
                    <th className="border p-2 text-left">Langue</th>
                    <th className="border p-2 text-left">logo_filename</th>
                    <th className="border p-2 text-left">Publié</th>
                    <th className="border p-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Acme Corp</td>
                    <td className="border p-2">1</td>
                    <td className="border p-2">Jean</td>
                    <td className="border p-2">Dupont</td>
                    <td className="border p-2">Excellent service</td>
                    <td className="border p-2">Service exceptionnel, je recommande vivement.</td>
                    <td className="border p-2">fr</td>
                    <td className="border p-2">acme_corp.png</td>
                    <td className="border p-2">true</td>
                    <td className="border p-2">5</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Tech Solutions</td>
                    <td className="border p-2">2</td>
                    <td className="border p-2">Marie</td>
                    <td className="border p-2">Martin</td>
                    <td className="border p-2">Très satisfait</td>
                    <td className="border p-2">Une équipe professionnelle et réactive.</td>
                    <td className="border p-2">fr</td>
                    <td className="border p-2">tech_solutions.jpg</td>
                    <td className="border p-2">true</td>
                    <td className="border p-2">4</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Format Publié */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Format "Publié"</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Les valeurs acceptées pour indiquer qu'un témoignage est publié:</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">Valeurs pour "Oui" (publié):</p>
                <div className="flex flex-wrap gap-2">
                  <code className="bg-background px-2 py-1 rounded">true</code>
                  <code className="bg-background px-2 py-1 rounded">True</code>
                  <code className="bg-background px-2 py-1 rounded">TRUE</code>
                  <code className="bg-background px-2 py-1 rounded">1</code>
                  <code className="bg-background px-2 py-1 rounded">Oui</code>
                  <code className="bg-background px-2 py-1 rounded">oui</code>
                  <code className="bg-background px-2 py-1 rounded">published</code>
                </div>
                <p className="font-medium text-foreground mb-1 mt-3">Valeurs pour "Non" (non publié):</p>
                <div className="flex flex-wrap gap-2">
                  <code className="bg-background px-2 py-1 rounded">false</code>
                  <code className="bg-background px-2 py-1 rounded">False</code>
                  <code className="bg-background px-2 py-1 rounded">FALSE</code>
                  <code className="bg-background px-2 py-1 rounded">0</code>
                  <code className="bg-background px-2 py-1 rounded">Non</code>
                  <code className="bg-background px-2 py-1 rounded">non</code>
                  <code className="bg-background px-2 py-1 rounded">draft</code>
                </div>
              </div>
            </div>
          </Card>

          {/* Format Note */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Format "Note"</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>La note doit être un nombre entier entre 1 et 5.</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-1">Exemples:</p>
                <div className="flex flex-wrap gap-2">
                  <code className="bg-background px-2 py-1 rounded">1</code>
                  <code className="bg-background px-2 py-1 rounded">2</code>
                  <code className="bg-background px-2 py-1 rounded">3</code>
                  <code className="bg-background px-2 py-1 rounded">4</code>
                  <code className="bg-background px-2 py-1 rounded">5</code>
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
                <span>Les témoignages existants seront <strong>mises à jour</strong> si le titre et l'entreprise correspondent exactement (insensible à la casse)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Les logos doivent être dans le ZIP pour être uploadés vers S3. Les URLs S3 fonctionnent aussi via la colonne <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">logo_url</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>L'ID Entreprise et l'ID Contact doivent correspondre à des enregistrements existants dans la base de données</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Assurez-vous que S3 est configuré pour que les logos soient uploadés correctement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Vous pouvez spécifier soit le nom de l'entreprise, soit l'ID Entreprise (ou les deux pour plus de précision)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Vous pouvez spécifier soit le prénom/nom du contact, soit l'ID Contact (ou les deux pour plus de précision)</span>
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
