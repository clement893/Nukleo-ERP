/**
 * Generate Excel template for company import
 * Creates a template file with all supported columns and example data
 */

import * as XLSX from 'xlsx';

export interface CompanyTemplateColumn {
  key: string;
  label: string;
  description?: string;
  example?: string;
  required?: boolean;
}

export const COMPANY_TEMPLATE_COLUMNS: CompanyTemplateColumn[] = [
  {
    key: 'name',
    label: 'Nom de l\'entreprise',
    description: 'Nom de l\'entreprise',
    example: 'Acme Corporation',
    required: true,
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Description de l\'entreprise',
    example: 'Entreprise spécialisée dans les solutions IT',
    required: false,
  },
  {
    key: 'website',
    label: 'Site web',
    description: 'URL du site web',
    example: 'https://www.acme.com',
    required: false,
  },
  {
    key: 'email',
    label: 'Courriel',
    description: 'Adresse email principale',
    example: 'contact@acme.com',
    required: false,
  },
  {
    key: 'phone',
    label: 'Téléphone',
    description: 'Numéro de téléphone',
    example: '+33 1 23 45 67 89',
    required: false,
  },
  {
    key: 'address',
    label: 'Adresse',
    description: 'Adresse complète',
    example: '123 Rue de la République',
    required: false,
  },
  {
    key: 'city',
    label: 'Ville',
    description: 'Ville',
    example: 'Paris',
    required: false,
  },
  {
    key: 'country',
    label: 'Pays',
    description: 'Pays',
    example: 'France',
    required: false,
  },
  {
    key: 'is_client',
    label: 'Est client',
    description: 'Oui/Non ou true/false',
    example: 'Oui',
    required: false,
  },
  {
    key: 'parent_company_id',
    label: 'ID Entreprise parente',
    description: 'Identifiant de l\'entreprise parente (optionnel)',
    example: '1',
    required: false,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'URL du profil LinkedIn',
    example: 'https://linkedin.com/company/acme',
    required: false,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    description: 'URL de la page Facebook',
    example: 'https://facebook.com/acme',
    required: false,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'URL du profil Instagram',
    example: 'https://instagram.com/acme',
    required: false,
  },
];

/**
 * Generate Excel template file for company import
 * @returns Blob containing the Excel file
 */
export function generateCompanyTemplate(): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create header row with labels
  const headers = COMPANY_TEMPLATE_COLUMNS.map(col => col.label);
  
  // Create example data row
  const exampleRow = COMPANY_TEMPLATE_COLUMNS.map(col => col.example || '');

  // Create worksheet data
  const wsData = [
    headers,
    exampleRow,
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  const colWidths = COMPANY_TEMPLATE_COLUMNS.map(() => ({ wch: 25 }));
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
  XLSX.utils.book_append_sheet(wb, ws, 'Entreprises');

  // Create instructions sheet
  const instructionsData = [
    ['Instructions pour l\'import d\'entreprises'],
    [''],
    ['Colonnes supportées:'],
    ...COMPANY_TEMPLATE_COLUMNS.map(col => [
      `- ${col.label} (${col.key})${col.required ? ' *REQUIS*' : ''}`,
      col.description || '',
      col.example ? `Exemple: ${col.example}` : '',
    ]),
    [''],
    ['Notes importantes:'],
    ['- La colonne "Nom de l\'entreprise" est REQUISE'],
    ['- Pour "Est client", utilisez: Oui/Non, oui/non, true/false, 1/0'],
    ['- Les IDs (parent_company_id) doivent correspondre à des enregistrements existants'],
    ['- Vous pouvez utiliser les noms de colonnes en français ou en anglais'],
    [''],
    ['Format des colonnes acceptées:'],
    ['Français: Nom de l\'entreprise, Description, Site web, Courriel, Téléphone, Adresse, Ville, Pays, Est client, ID Entreprise parente, LinkedIn, Facebook, Instagram'],
    ['Anglais: name, description, website, email, phone, address, city, country, is_client, parent_company_id, linkedin, facebook, instagram'],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // Convert to blob
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download the company template Excel file
 */
export function downloadCompanyTemplate(): void {
  const blob = generateCompanyTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-entreprises-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate ZIP template with Excel file and instructions for importing companies with logos
 * @returns Blob containing the ZIP file
 */
export async function generateCompanyZipTemplate(): Promise<Blob> {
  // Import JSZip dynamically to avoid SSR issues
  const JSZipModule = await import('jszip') as any;
  // Handle both default export and named export
  const JSZip = JSZipModule.default || JSZipModule;
  const zip = new JSZip();

  // Generate Excel template
  const excelBlob = generateCompanyTemplate();
  const excelArrayBuffer = await excelBlob.arrayBuffer();
  zip.file('entreprises.xlsx', excelArrayBuffer);

  // Create README with instructions
  const readmeContent = `# Instructions pour l'import d'entreprises avec logos

## Structure du fichier ZIP

Votre fichier ZIP doit contenir :
- \`entreprises.xlsx\` : Fichier Excel avec les données des entreprises
- \`logos/\` : Dossier contenant les logos des entreprises (optionnel)

## Structure recommandée

\`\`\`
entreprises_import.zip
├── entreprises.xlsx
└── logos/
    ├── acme_corporation.jpg
    ├── tech_solutions.png
    └── ...
\`\`\`

## Format du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

### Colonnes requises
- **Nom de l'entreprise** (ou \`name\`) : Nom de l'entreprise *REQUIS*

### Colonnes optionnelles
- **Description** (ou \`description\`) : Description de l'entreprise
- **Site web** (ou \`website\`) : URL du site web
- **Courriel** (ou \`email\`) : Adresse email principale
- **Téléphone** (ou \`phone\`) : Numéro de téléphone
- **Adresse** (ou \`address\`) : Adresse complète
- **Ville** (ou \`city\`) : Ville
- **Pays** (ou \`country\`) : Pays
- **Est client** (ou \`is_client\`) : Oui/Non ou true/false
- **ID Entreprise parente** (ou \`parent_company_id\`) : Identifiant de l'entreprise parente
- **LinkedIn** (ou \`linkedin\`) : URL du profil LinkedIn
- **Facebook** (ou \`facebook\`) : URL de la page Facebook
- **Instagram** (ou \`instagram\`) : URL du profil Instagram
- **Logo URL** (ou \`logo_url\`) : URL du logo (alternative aux fichiers dans logos/)

## Nommage des logos

Les logos doivent être nommés selon l'un de ces formats :
- \`nom_entreprise.jpg\` (ex: \`acme_corporation.jpg\`)
- \`nom_entreprise.png\`
- \`nom_entreprise.jpeg\`

**Exemples :**
- Entreprise : Acme Corporation → Logo : \`acme_corporation.jpg\`
- Entreprise : Tech Solutions → Logo : \`tech_solutions.png\`

### Format alternatif

Vous pouvez aussi spécifier le nom du fichier logo dans une colonne Excel :
- **Nom fichier logo** (ou \`logo_filename\`) : Nom exact du fichier logo

## Formats de logos supportés

- .jpg / .jpeg
- .png
- .gif
- .webp

## Exemple de fichier Excel

| Nom de l'entreprise | Description              | Site web              | Courriel              | Téléphone      | Est client |
|---------------------|--------------------------|-----------------------|-----------------------|----------------|------------|
| Acme Corporation    | Solutions IT innovantes  | https://acme.com      | contact@acme.com      | +33 1 23 45 67 | Oui        |
| Tech Solutions      | Services technologiques  | https://techsol.com   | info@techsol.com      | +33 1 98 76 54 | Non        |

## Processus d'import

1. Téléchargez ce modèle ZIP
2. Décompressez le fichier
3. Remplissez le fichier \`entreprises.xlsx\` avec vos données
4. Ajoutez les logos dans le dossier \`logos/\` en suivant le format de nommage
5. Recompressez le tout en ZIP
6. Importez le fichier ZIP via l'interface

## Notes importantes

- La colonne "Nom de l'entreprise" est REQUISE
- Les logos sont automatiquement associés aux entreprises par leur nom
- Si un logo n'est pas trouvé, l'entreprise sera créée sans logo
- Vous pouvez utiliser soit des logos dans le ZIP, soit des URLs dans la colonne Logo URL
- Les IDs (parent_company_id) doivent correspondre à des enregistrements existants dans le système
- Pour "Est client", utilisez: Oui/Non, oui/non, true/false, 1/0

## Support

En cas de problème lors de l'import, vérifiez :
- Le format du fichier Excel (doit être .xlsx ou .xls)
- Le nommage des logos (doit correspondre au format nom_entreprise)
- La colonne requise est présente et remplie
- Le nom de l'entreprise correspond au nom du fichier logo (sans espaces, avec underscores)
`;

  zip.file('README.txt', readmeContent);

  // Create logos folder with a placeholder/instructions file
  const logosInstructions = `# Dossier Logos

Placez ici les logos de vos entreprises.

## Format de nommage

Nommez vos logos selon le format : \`nom_entreprise.extension\`

Exemples :
- acme_corporation.jpg
- tech_solutions.png
- global_services.jpeg

## Formats acceptés

- .jpg / .jpeg
- .png
- .gif
- .webp

## Important

- Les noms de fichiers doivent être en minuscules
- Utilisez des underscores (_) pour remplacer les espaces dans le nom de l'entreprise
- Le système associera automatiquement les logos aux entreprises correspondantes dans le fichier Excel
- Le nom du logo doit correspondre au nom de l'entreprise dans Excel (sans espaces, avec underscores)
`;

  zip.folder('logos')?.file('INSTRUCTIONS.txt', logosInstructions);

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Download the company ZIP template (Excel + instructions)
 */
export async function downloadCompanyZipTemplate(): Promise<void> {
  const blob = await generateCompanyZipTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-entreprises-avec-logos-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
