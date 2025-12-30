/**
 * Generate Project Import Template
 * Creates Excel template for importing projects
 */

import * as XLSX from 'xlsx';

/**
 * Generate Excel template for project import
 * @returns Blob containing the Excel file
 */
export function generateProjectTemplate(): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Define columns
  const columns = [
    { header: 'Nom du projet', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Statut', key: 'status', width: 15 },
    { header: 'Client', key: 'client', width: 30 },
    { header: 'Client ID', key: 'client_id', width: 12 },
    { header: 'Responsable', key: 'responsable', width: 30 },
    { header: 'Responsable ID', key: 'responsable_id', width: 15 },
  ];

  // Create sample data
  const sampleData = [
    {
      'Nom du projet': 'Exemple Projet 1',
      'Description': 'Description du projet exemple',
      'Statut': 'active',
      'Client': 'Nom de l\'entreprise',
      'Client ID': '',
      'Responsable': 'Prénom Nom',
      'Responsable ID': '',
    },
  ];

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(sampleData, { header: columns.map(c => c.header) });

  // Set column widths
  ws['!cols'] = columns.map(col => ({ wch: col.width }));

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Projets');

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download the project Excel template
 */
export function downloadProjectTemplate(): void {
  const blob = generateProjectTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-projets-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate ZIP template with Excel file and instructions for importing projects with documents
 * @returns Blob containing the ZIP file
 */
export async function generateProjectZipTemplate(): Promise<Blob> {
  // Import JSZip dynamically to avoid SSR issues
  const JSZipModule = await import('jszip') as any;
  // Handle both default export and named export
  const JSZip = JSZipModule.default || JSZipModule;
  const zip = new JSZip();

  // Generate Excel template
  const excelBlob = generateProjectTemplate();
  const excelArrayBuffer = await excelBlob.arrayBuffer();
  zip.file('projets.xlsx', excelArrayBuffer);

  // Create README with instructions
  const readmeContent = `# Instructions pour l'import de projets

## Structure du fichier ZIP

Votre fichier ZIP doit contenir :
- \`projets.xlsx\` : Fichier Excel avec les données des projets
- \`documents/\` : Dossier contenant les documents des projets (optionnel)

## Structure recommandée

\`\`\`
projets_import.zip
├── projets.xlsx
└── documents/
    ├── projet1_soumission.pdf
    ├── projet1_budget.xlsx
    ├── projet1_drive/
    └── ...
\`\`\`

## Format du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

### Colonnes requises
- **Nom du projet** (ou \`name\`) : Nom du projet *REQUIS*

### Colonnes optionnelles
- **Description** (ou \`description\`) : Description du projet
- **Statut** (ou \`status\`) : active, archived, completed (défaut: active)
- **Client** (ou \`client\`, \`client_name\`) : Nom du client (sera automatiquement lié si l'entreprise existe)
- **Client ID** (ou \`client_id\`) : ID de l'entreprise (si connu)
- **Responsable** (ou \`responsable\`, \`responsable_name\`) : Nom complet du responsable (Prénom Nom)
- **Responsable ID** (ou \`responsable_id\`) : ID de l'employé responsable (si connu)

## Format des statuts

Les statuts acceptés sont :
- \`active\` : Projet actif
- \`archived\` : Projet archivé
- \`completed\` : Projet complété

Si aucun statut n'est spécifié, le projet sera créé avec le statut \`active\`.

## Association automatique

- **Client** : Si vous fournissez le nom du client (colonne "Client"), le système tentera de trouver automatiquement l'entreprise correspondante dans la base de données. Si une correspondance est trouvée, le projet sera automatiquement lié à cette entreprise.
- **Responsable** : Si vous fournissez le nom complet du responsable (format "Prénom Nom"), le système tentera de trouver l'employé correspondant. Si une correspondance est trouvée, le projet sera automatiquement assigné à cet employé.

## Documents

Les documents peuvent être organisés dans le dossier \`documents/\` du fichier ZIP. Les documents peuvent être référencés dans la description du projet ou ajoutés manuellement après l'import.

## Exemple de données

| Nom du projet | Description | Statut | Client | Responsable |
|--------------|-------------|--------|--------|-------------|
| Site Web E-commerce | Développement d'un site e-commerce | active | Acme Corp | Jean Dupont |
| Application Mobile | Application mobile iOS/Android | active | TechStart Inc | Marie Martin |

## Étapes d'import

1. Téléchargez le modèle ZIP
2. Décompressez le fichier ZIP
3. Modifiez le fichier \`projets.xlsx\` avec vos données
4. Ajoutez les documents dans le dossier \`documents/\` (optionnel)
5. Recompressez le tout en ZIP
6. Importez le fichier ZIP via l'interface

## Notes importantes

- Les colonnes marquées *REQUIS* doivent être remplies
- Les IDs (client_id, responsable_id) doivent correspondre à des enregistrements existants dans le système
- Si vous fournissez un nom au lieu d'un ID, le système tentera de faire une correspondance automatique
- Les documents dans le dossier \`documents/\` ne sont pas automatiquement associés aux projets lors de l'import

## Support

En cas de problème lors de l'import, vérifiez :
- Le format du fichier Excel (doit être .xlsx ou .xls)
- Les colonnes requises sont présentes et remplies
- Le format des statuts (active, archived, completed)
- Les noms de clients et responsables correspondent aux enregistrements existants
`;

  zip.file('README.txt', readmeContent);

  // Create documents folder with a placeholder/instructions file
  const documentsInstructions = `# Dossier Documents

Placez ici les documents de vos projets.

## Structure recommandée

Organisez vos documents par projet. Vous pouvez créer des sous-dossiers pour chaque projet ou utiliser un format de nommage cohérent.

Exemples :
- projet1_soumission.pdf
- projet1_budget.xlsx
- projet1_drive/
- projet2_soumission.pdf
- projet2_budget.xlsx

## Types de documents supportés

- Soumissions
- Budgets
- Documents Drive
- Autres fichiers pertinents

## Important

- Les documents ne sont pas automatiquement associés aux projets lors de l'import
- Vous devrez peut-être associer manuellement les documents aux projets après l'import
- Utilisez un format de nommage cohérent pour faciliter l'organisation
`;

  zip.folder('documents')?.file('INSTRUCTIONS.txt', documentsInstructions);

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Download the project ZIP template (Excel + instructions + documents folder)
 */
export async function downloadProjectZipTemplate(): Promise<void> {
  const blob = await generateProjectZipTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-projets-avec-documents-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
