'use client';

import { X, FileSpreadsheet, Image, CheckCircle2, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface ImportEmployeesInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate?: () => void;
}

export default function ImportEmployeesInstructions({
  isOpen,
  onClose,
  onDownloadTemplate,
}: ImportEmployeesInstructionsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Instructions d'import d'employés</h2>
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
                <span><strong>Fichier Excel seul</strong> (.xlsx, .xls) - Import simple avec URLs de photos</span>
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
              <div className="text-foreground">employees.zip</div>
              <div className="ml-4 mt-1">
                <div className="text-blue-500">├── employees.xlsx</div>
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
              <p><strong>Fichier Excel:</strong> Doit être nommé <code className="bg-background px-1 py-0.5 rounded">employees.xlsx</code> ou <code className="bg-background px-1 py-0.5 rounded">employees.xls</code></p>
              <p><strong>Dossier photos:</strong> Optionnel, peut être à la racine du ZIP ou dans un dossier <code className="bg-background px-1 py-0.5 rounded">photos/</code></p>
            </div>
          </Card>

          {/* Colonnes Excel */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Colonnes Excel supportées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium mb-2">Informations personnelles:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>first_name</strong> / prénom / prenom *REQUIS*</li>
                  <li>• <strong>last_name</strong> / nom / surname *REQUIS*</li>
                  <li>• <strong>email</strong> / courriel / e-mail</li>
                  <li>• <strong>phone</strong> / téléphone / tel</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Informations professionnelles:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>linkedin</strong> / linkedin_url</li>
                  <li>• <strong>hire_date</strong> / date_embauche / date d'embauche</li>
                  <li>• <strong>birthday</strong> / anniversaire / date de naissance</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Photos:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>photo_url</strong> / photo / image_url</li>
                  <li>• <strong>photo_filename</strong> / nom_fichier_photo</li>
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
                  Les photos sont automatiquement associées aux employés si elles suivent ce format:
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                  <div className="text-green-500">prénom_nom.jpg</div>
                  <div className="text-muted-foreground mt-1">Exemples:</div>
                  <div className="text-foreground">jean_dupont.jpg</div>
                  <div className="text-foreground">marie_martin.png</div>
                  <div className="text-foreground">pierre_durand.jpeg</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Les accents et espaces sont automatiquement normalisés. 
                  Formats acceptés: .jpg, .jpeg, .png, .gif, .webp
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Méthode 2: Colonne Excel</p>
                <p className="text-muted-foreground">
                  Spécifiez le nom exact du fichier photo dans la colonne <code className="bg-background px-1 py-0.5 rounded">photo_filename</code> ou <code className="bg-background px-1 py-0.5 rounded">nom_fichier_photo</code>
                </p>
              </div>
            </div>
          </Card>

          {/* Télécharger le modèle */}
          <Card className="p-4 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">Télécharger le modèle</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez le modèle ZIP avec le fichier Excel et les instructions pour faciliter l'import
                </p>
              </div>
              <Button
                onClick={() => {
                  onDownloadTemplate?.();
                }}
                variant="default"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le modèle ZIP
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Modal>
  );
}
