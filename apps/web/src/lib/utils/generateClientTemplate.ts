/**
 * Generate Excel template for client import
 * Creates a template file with all supported columns and example data
 */

import * as XLSX from 'xlsx';

export interface ClientTemplateColumn {
  key: string;
  label: string;
  description?: string;
  example?: string;
  required?: boolean;
}

export const CLIENT_TEMPLATE_COLUMNS: ClientTemplateColumn[] = [
  {
    key: 'company_name',
    label: 'Nom de l\'entreprise',
    description: 'Nom de l\'entreprise (sera créée si elle n\'existe pas)',
    example: 'Exemple Entreprise SARL',
    required: true,
  },
  {
    key: 'company_id',
    label: 'ID Entreprise',
    description: 'Identifiant de l\'entreprise existante (optionnel si company_name est fourni)',
    example: '1',
    required: false,
  },
  {
    key: 'status',
    label: 'Statut',
    description: 'Statut du client (actif, inactif, maintenance)',
    example: 'actif',
    required: false,
  },
  {
    key: 'responsible_id',
    label: 'ID Responsable',
    description: 'Identifiant de l\'employé responsable',
    example: '1',
    required: false,
  },
  {
    key: 'notes',
    label: 'Notes',
    description: 'Notes sur le client',
    example: 'Client important depuis 2020',
    required: false,
  },
  {
    key: 'comments',
    label: 'Commentaires',
    description: 'Commentaires additionnels',
    example: 'Renouvellement prévu en janvier',
    required: false,
  },
  {
    key: 'portal_url',
    label: 'URL Portail',
    description: 'URL du portail client',
    example: 'https://portail.client.com',
    required: false,
  },
];

/**
 * Generate Excel template file for client import
 * @returns Blob containing the Excel file
 */
export function generateClientTemplate(): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create header row with labels
  const headers = CLIENT_TEMPLATE_COLUMNS.map(col => col.label);
  
  // Create example data row
  const exampleRow = CLIENT_TEMPLATE_COLUMNS.map(col => col.example || '');

  // Create worksheet data
  const wsData = [
    headers,
    exampleRow,
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  const colWidths = CLIENT_TEMPLATE_COLUMNS.map(() => ({ wch: 25 }));
  ws['!cols'] = colWidths;

  // Style header row (bold)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E0E0E0' } },
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');

  // Create instructions sheet
  const instructionsData = [
    ['Instructions pour l\'import de clients'],
    [''],
    ['Colonnes supportées:'],
    ...CLIENT_TEMPLATE_COLUMNS.map(col => [
      `- ${col.label} (${col.key})${col.required ? ' *REQUIS*' : ''}`,
      col.description || '',
      col.example ? `Exemple: ${col.example}` : '',
    ]),
    [''],
    ['Notes importantes:'],
    ['- La colonne "Nom de l\'entreprise" est REQUISE'],
    ['- Si l\'entreprise n\'existe pas, elle sera créée automatiquement'],
    ['- Les statuts acceptés sont: actif, inactif, maintenance'],
    ['- Les IDs (company_id, responsible_id) doivent correspondre à des enregistrements existants'],
    ['- Vous pouvez utiliser les noms de colonnes en français ou en anglais'],
    [''],
    ['Format des colonnes acceptées:'],
    ['Français: Nom de l\'entreprise, ID Entreprise, Statut, ID Responsable, Notes, Commentaires, URL Portail'],
    ['Anglais: company_name, company_id, status, responsible_id, notes, comments, portal_url'],
    [''],
    ['Matching des entreprises:'],
    ['Le système essaiera automatiquement de faire correspondre les entreprises par nom:'],
    ['- Correspondance exacte (insensible à la casse)'],
    ['- Correspondance sans forme juridique (SARL, SA, SAS, EURL)'],
    ['- Correspondance partielle'],
    ['Si aucune entreprise correspondante n\'est trouvée, une nouvelle entreprise sera créée automatiquement'],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // Convert to blob
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download the client template Excel file
 */
export function downloadClientTemplate(): void {
  const blob = generateClientTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-clients-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate ZIP template with Excel file and instructions for importing clients with logos
 * @returns Blob containing the ZIP file
 */
export async function generateClientZipTemplate(): Promise<Blob> {
  // Import JSZip dynamically to avoid SSR issues
  // Type assertion needed because TypeScript can't resolve dynamic imports at compile time
  const JSZipModule = await import('jszip') as any;
  // Handle both default export and named export
  const JSZip = JSZipModule.default || JSZipModule;
  const zip = new JSZip();

  // Generate Excel template
  const excelBlob = generateClientTemplate();
  const excelArrayBuffer = await excelBlob.arrayBuffer();
  zip.file('clients.xlsx', excelArrayBuffer);

  // Create README with instructions
  const readmeContent = `# Instructions pour l'import de clients avec logos

## Structure du fichier ZIP

Votre fichier ZIP doit contenir :
- \`clients.xlsx\` : Fichier Excel avec les données des clients
- \`logos/\` : Dossier contenant les logos des entreprises (optionnel)

## Structure recommandée

\`\`\`
clients_import.zip
├── clients.xlsx
└── logos/
    ├── exemple_entreprise_sarl.jpg
    ├── acme_corp.png
    └── ...
\`\`\`

## Format du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

### Colonnes requises
- **Nom de l'entreprise** (ou \`company_name\`) : Nom de l'entreprise *REQUIS*
  - L'entreprise sera créée automatiquement si elle n'existe pas
  - Le système essaiera de faire correspondre par nom (exact, sans forme juridique, ou partiel)

### Colonnes optionnelles
- **ID Entreprise** (ou \`company_id\`) : Identifiant de l'entreprise existante
- **Statut** (ou \`status\`) : actif, inactif, ou maintenance (défaut: actif)
- **ID Responsable** (ou \`responsible_id\`) : Identifiant de l'employé responsable
- **Notes** (ou \`notes\`) : Notes sur le client
- **Commentaires** (ou \`comments\`) : Commentaires additionnels
- **URL Portail** (ou \`portal_url\`) : URL du portail client

## Nommage des logos

Les logos doivent être nommés selon le nom de l'entreprise (normalisé) :
- Le nom de l'entreprise est converti en minuscules
- Les accents et caractères spéciaux sont supprimés
- Les espaces sont remplacés par des underscores

**Exemples :**
- Entreprise : "Exemple Entreprise SARL" → Logo : \`exemple_entreprise_sarl.jpg\`
- Entreprise : "Acme Corp" → Logo : \`acme_corp.png\`

### Format alternatif

Vous pouvez aussi spécifier le nom du fichier logo dans une colonne Excel :
- **Nom fichier logo** (ou \`logo_filename\`) : Nom exact du fichier logo

## Formats de logos supportés

- .jpg / .jpeg
- .png
- .gif
- .webp

## Exemple de fichier Excel

| Nom de l'entreprise | Statut | ID Responsable | Notes | URL Portail |
|---------------------|--------|----------------|-------|-------------|
| Exemple Entreprise SARL | actif | 1 | Client important | https://portail.client.com |
| Acme Corp | actif | 2 | Nouveau client | https://acme.portail.com |

## Processus d'import

1. Téléchargez ce modèle ZIP
2. Décompressez le fichier
3. Remplissez le fichier \`clients.xlsx\` avec vos données
4. Ajoutez les logos dans le dossier \`logos/\` en suivant le format de nommage
5. Recompressez le tout en ZIP
6. Importez le fichier ZIP via l'interface

## Matching des entreprises

Le système essaiera automatiquement de faire correspondre les entreprises par nom :
- **Correspondance exacte** (insensible à la casse)
- **Correspondance sans forme juridique** (SARL, SA, SAS, EURL)
- **Correspondance partielle** (contient)

Si aucune entreprise correspondante n'est trouvée, une nouvelle entreprise sera créée automatiquement et marquée comme client (\`is_client=True\`).

## Notes importantes

- La colonne "Nom de l'entreprise" est REQUISE
- Les logos sont automatiquement associés aux entreprises par leur nom normalisé
- Si un logo n'est pas trouvé, le client sera créé sans logo
- Vous pouvez utiliser soit des logos dans le ZIP, soit des URLs dans une colonne Logo URL (si supporté)
- Les IDs (company_id, responsible_id) doivent correspondre à des enregistrements existants dans le système
- Les entreprises créées automatiquement seront marquées comme clients

## Support

En cas de problème lors de l'import, vérifiez :
- Le format du fichier Excel (doit être .xlsx ou .xls)
- Le nommage des logos (doit correspondre au nom normalisé de l'entreprise)
- La colonne "Nom de l'entreprise" est présente et remplie
- Les statuts utilisés sont valides (actif, inactif, maintenance)
`;

  zip.file('README.txt', readmeContent);

  // Create logos folder with a placeholder/instructions file
  const logosInstructions = `# Dossier Logos

Placez ici les logos de vos entreprises.

## Format de nommage

Nommez vos logos selon le nom normalisé de l'entreprise : \`nom_entreprise.extension\`

Le nom est normalisé automatiquement :
- Converti en minuscules
- Accents et caractères spéciaux supprimés
- Espaces remplacés par des underscores

Exemples :
- "Exemple Entreprise SARL" → exemple_entreprise_sarl.jpg
- "Acme Corp" → acme_corp.png
- "Société Générale" → societe_generale.jpeg

## Formats acceptés

- .jpg / .jpeg
- .png
- .gif
- .webp

## Important

- Les noms de fichiers doivent correspondre au nom normalisé de l'entreprise
- Utilisez des underscores (_) pour séparer les mots
- Le système associera automatiquement les logos aux entreprises correspondantes dans le fichier Excel
- Si le logo n'est pas trouvé, le client sera créé sans logo
`;

  zip.folder('logos')?.file('INSTRUCTIONS.txt', logosInstructions);

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Download the client ZIP template (Excel + instructions)
 */
export async function downloadClientZipTemplate(): Promise<void> {
  const blob = await generateClientZipTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-clients-avec-logos-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
