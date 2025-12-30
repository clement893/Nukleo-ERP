'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Download } from 'lucide-react';
import Button from '@/components/ui/Button';

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
      // Create a simple Excel template structure
      const templateData = [
        {
          'Nom de l\'entreprise': 'Exemple Entreprise SARL',
          'Statut': 'actif',
          'Responsable ID': '',
          'Notes': 'Notes sur le client',
          'Commentaires': 'Commentaires additionnels',
          'URL Portail': 'https://portail.client.com',
        },
      ];
      
      // Use a simple CSV format for template (can be opened in Excel)
      const firstRow = templateData[0];
      if (!firstRow) {
        throw new Error('Template data is empty');
      }
      const csvContent = [
        Object.keys(firstRow).join(','),
        ...templateData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modele_import_clients.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
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
    <Modal isOpen={isOpen} onClose={onClose} title="Instructions d'import de clients" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Format de fichier supporté</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Vous pouvez importer des clients depuis un fichier Excel (.xlsx, .xls) ou un fichier ZIP contenant :
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
            <li>Un fichier Excel avec les données des clients</li>
            <li>Un dossier <code className="bg-muted px-1 rounded">logos/</code> (optionnel) contenant les logos des entreprises</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Colonnes supportées</h3>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">Colonnes obligatoires :</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Nom de l'entreprise</strong> : Nom de l'entreprise (sera créée si elle n'existe pas)</li>
              </ul>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">Colonnes optionnelles :</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>ID Entreprise</strong> : ID de l'entreprise existante (si l'entreprise existe déjà)</li>
                <li><strong>Statut</strong> : actif, inactif, ou maintenance</li>
                <li><strong>Responsable ID</strong> : ID de l'employé responsable</li>
                <li><strong>Notes</strong> : Notes sur le client</li>
                <li><strong>Commentaires</strong> : Commentaires additionnels</li>
                <li><strong>URL Portail</strong> : URL du portail client</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Matching des entreprises</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Le système essaiera automatiquement de faire correspondre les entreprises par nom :
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
            <li>Correspondance exacte (insensible à la casse)</li>
            <li>Correspondance sans forme juridique (SARL, SA, SAS, EURL)</li>
            <li>Correspondance partielle</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Si aucune entreprise correspondante n'est trouvée, une nouvelle entreprise sera créée automatiquement et marquée comme client.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Import de logos</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Pour importer des logos avec les clients, créez un fichier ZIP contenant :
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
            <li>Le fichier Excel avec les données</li>
            <li>Un dossier <code className="bg-muted px-1 rounded">logos/</code> contenant les images</li>
            <li>Les logos doivent être nommés selon le nom de l'entreprise (normalisé)</li>
          </ul>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Téléchargement...' : 'Télécharger le modèle'}
          </Button>
          <Button variant="primary" onClick={onClose} className="flex-1">
            J'ai compris
          </Button>
        </div>
      </div>
    </Modal>
  );
}
