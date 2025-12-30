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
    description: 'Nom de l\'entreprise (requis)',
    example: 'Acme Corporation',
    required: true,
  },
  {
    key: 'website',
    label: 'Site web',
    description: 'URL du site web',
    example: 'https://www.acme.com',
    required: false,
  },
  {
    key: 'logo_url',
    label: 'Logo URL (S3)',
    description: 'URL S3 du logo ou nom du fichier dans le ZIP',
    example: 'logos/acme.jpg',
    required: false,
  },
  {
    key: 'country',
    label: 'Pays',
    description: 'Pays de l\'entreprise',
    example: 'France',
    required: false,
  },
  {
    key: 'is_client',
    label: 'Client (Y/N)',
    description: 'Oui ou Non',
    example: 'Oui',
    required: false,
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Description de l\'entreprise',
    example: 'Entreprise spécialisée dans...',
    required: false,
  },
  {
    key: 'email',
    label: 'Courriel',
    description: 'Adresse email',
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
    example: '123 Rue Example',
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
    key: 'parent_company_id',
    label: 'ID Entreprise parente',
    description: 'ID de l\'entreprise parente (si filiale)',
    example: '1',
    required: false,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    description: 'URL Facebook',
    example: 'https://facebook.com/acme',
    required: false,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'URL Instagram',
    example: 'https://instagram.com/acme',
    required: false,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'URL LinkedIn',
    example: 'https://linkedin.com/company/acme',
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
  const colWidths = COMPANY_TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));
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
    ['Colonnes requises:'],
    ['- Nom de l\'entreprise'],
    [''],
    ['Colonnes optionnelles:'],
    ['- Site web, Logo URL (S3), Pays, Client (Y/N), Description, Courriel, Téléphone, Adresse, Ville'],
    ['- ID Entreprise parente, Facebook, Instagram, LinkedIn'],
    [''],
    ['Format Client (Y/N):'],
    ['- Oui, Yes, True, 1 pour client'],
    ['- Non, No, False, 0 pour non-client'],
    [''],
    ['Pour les logos dans un ZIP:'],
    ['- Placez les logos dans un dossier "logos/"'],
    ['- Nommez les fichiers selon le nom de l\'entreprise (ex: acme.jpg)'],
    ['- Ou référencez le nom du fichier dans la colonne "Logo URL (S3)"'],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // Generate blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
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
    ├── acme.jpg
    ├── example.png
    └── ...
\`\`\`

## Format du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

### Colonnes requises
- **Nom de l'entreprise** (ou \`name\`) : Nom de l'entreprise *REQUIS*

### Colonnes optionnelles
- **Site web** (ou \`website\`) : URL du site web
- **Logo URL (S3)** (ou \`logo_url\`) : URL S3 du logo ou nom du fichier dans le ZIP
- **Pays** (ou \`country\`) : Pays de l'entreprise
- **Client (Y/N)** (ou \`is_client\`) : Oui/Non pour indiquer si c'est un client
- **Description** : Description de l'entreprise
- **Courriel** (ou \`email\`) : Adresse email
- **Téléphone** (ou \`phone\`) : Numéro de téléphone
- **Adresse** (ou \`address\`) : Adresse complète
- **Ville** (ou \`city\`) : Ville
- **ID Entreprise parente** (ou \`parent_company_id\`) : ID de l'entreprise parente (si filiale)
- **Facebook** : URL Facebook
- **Instagram** : URL Instagram
- **LinkedIn** : URL LinkedIn

## Format Client (Y/N)

Les valeurs acceptées pour "Client (Y/N)" sont :
- **Oui** : Oui, Yes, True, 1, Vrai, O
- **Non** : Non, No, False, 0, Faux, N

## Logos

### Option 1 : Logo dans le ZIP
1. Placez les logos dans un dossier \`logos/\` dans le ZIP
2. Nommez les fichiers selon le nom de l'entreprise (normalisé, sans accents, espaces remplacés par _)
3. Exemple : \`logos/acme_corporation.jpg\`

### Option 2 : Logo URL S3
1. Indiquez l'URL S3 complète dans la colonne "Logo URL (S3)"
2. Format : \`companies/logos/acme.jpg\` ou URL complète

## Notes importantes

- Les noms de colonnes sont insensibles à la casse et aux accents
- Les entreprises existantes seront mises à jour si le nom correspond
- Les logos seront automatiquement uploadés vers S3 si présents dans le ZIP
`;

  zip.file('README.md', readmeContent);

  // Generate ZIP blob
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
