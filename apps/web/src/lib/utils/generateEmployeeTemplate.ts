/**
 * Generate Excel template for employee import
 * Creates a template file with all supported columns and example data
 */

import * as XLSX from 'xlsx';

export interface EmployeeTemplateColumn {
  key: string;
  label: string;
  description?: string;
  example?: string;
  required?: boolean;
}

export const EMPLOYEE_TEMPLATE_COLUMNS: EmployeeTemplateColumn[] = [
  {
    key: 'first_name',
    label: 'Prénom',
    description: 'Prénom de l\'employé',
    example: 'Jean',
    required: true,
  },
  {
    key: 'last_name',
    label: 'Nom',
    description: 'Nom de famille de l\'employé',
    example: 'Dupont',
    required: true,
  },
  {
    key: 'email',
    label: 'Courriel',
    description: 'Adresse email de l\'employé',
    example: 'jean.dupont@example.com',
    required: false,
  },
  {
    key: 'phone',
    label: 'Téléphone',
    description: 'Numéro de téléphone',
    example: '+33 6 12 34 56 78',
    required: false,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'URL du profil LinkedIn',
    example: 'https://linkedin.com/in/jeandupont',
    required: false,
  },
  {
    key: 'hire_date',
    label: 'Date d\'embauche',
    description: 'Date d\'embauche (format: YYYY-MM-DD)',
    example: '2020-01-15',
    required: false,
  },
  {
    key: 'birthday',
    label: 'Anniversaire',
    description: 'Date d\'anniversaire (format: YYYY-MM-DD)',
    example: '1980-05-15',
    required: false,
  },
  {
    key: 'photo_filename',
    label: 'Nom fichier photo',
    description: 'Nom du fichier photo dans le dossier photos/ (ex: jean_dupont.jpg)',
    example: 'jean_dupont.jpg',
    required: false,
  },
];

/**
 * Generate Excel template file for employee import
 * @returns Blob containing the Excel file
 */
export function generateEmployeeTemplate(): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create header row with labels
  const headers = EMPLOYEE_TEMPLATE_COLUMNS.map(col => col.label);
  
  // Create example data row
  const exampleRow = EMPLOYEE_TEMPLATE_COLUMNS.map(col => col.example || '');

  // Create worksheet data
  const wsData = [
    headers,
    exampleRow,
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  const colWidths = EMPLOYEE_TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));
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
  XLSX.utils.book_append_sheet(wb, ws, 'Employés');

  // Create instructions sheet
  const instructionsData = [
    ['Instructions pour l\'import d\'employés'],
    [''],
    ['Colonnes supportées:'],
    ...EMPLOYEE_TEMPLATE_COLUMNS.map(col => [
      `- ${col.label} (${col.key})${col.required ? ' *REQUIS*' : ''}`,
      col.description || '',
      col.example ? `Exemple: ${col.example}` : '',
    ]),
    [''],
    ['Notes importantes:'],
    ['- Les colonnes marquées *REQUIS* doivent être remplies'],
    ['- Le format de date est YYYY-MM-DD (ex: 2020-01-15)'],
    ['- Vous pouvez utiliser les noms de colonnes en français ou en anglais'],
    [''],
    ['Format des colonnes acceptées:'],
    ['Français: Prénom, Nom, Courriel, Téléphone, LinkedIn, Date d\'embauche, Anniversaire, Nom fichier photo'],
    ['Anglais: first_name, last_name, email, phone, linkedin, hire_date, birthday, photo_filename'],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // Convert to blob
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download the employee template Excel file
 */
export function downloadEmployeeTemplate(): void {
  const blob = generateEmployeeTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-employes-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate ZIP template with Excel file and instructions for importing employees with photos
 * @returns Blob containing the ZIP file
 */
export async function generateEmployeeZipTemplate(): Promise<Blob> {
  // Import JSZip dynamically to avoid SSR issues
  const JSZipModule = await import('jszip') as any;
  const JSZip = JSZipModule.default || JSZipModule;
  const zip = new JSZip();

  // Generate Excel template
  const excelBlob = generateEmployeeTemplate();
  const excelArrayBuffer = await excelBlob.arrayBuffer();
  zip.file('employees.xlsx', excelArrayBuffer);

  // Create README with instructions
  const readmeContent = `# Instructions pour l'import d'employés avec photos

## Structure du fichier ZIP

Votre fichier ZIP doit contenir :
- \`employees.xlsx\` : Fichier Excel avec les données des employés
- \`photos/\` : Dossier contenant les photos des employés (optionnel)

## Structure recommandée

\`\`\`
employees_import.zip
├── employees.xlsx
└── photos/
    ├── jean_dupont.jpg
    ├── marie_martin.png
    └── ...
\`\`\`

## Format du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

### Colonnes requises
- **Prénom** (ou \`first_name\`) : Prénom de l'employé *REQUIS*
- **Nom** (ou \`last_name\`) : Nom de famille de l'employé *REQUIS*

### Colonnes optionnelles
- **Courriel** (ou \`email\`) : Adresse email
- **Téléphone** (ou \`phone\`) : Numéro de téléphone
- **LinkedIn** (ou \`linkedin\`) : URL du profil LinkedIn
- **Date d'embauche** (ou \`hire_date\`) : Date au format YYYY-MM-DD (ex: 2020-01-15)
- **Anniversaire** (ou \`birthday\`) : Date au format YYYY-MM-DD (ex: 1980-05-15)
- **Nom fichier photo** (ou \`photo_filename\`) : Nom du fichier photo dans le dossier photos/

## Nommage des photos

Les photos doivent être nommées selon l'un de ces formats :
- \`prénom_nom.jpg\` (ex: \`jean_dupont.jpg\`)
- \`prénom_nom.png\`
- \`prénom_nom.jpeg\`

**Exemples :**
- Employé : Jean Dupont → Photo : \`jean_dupont.jpg\`
- Employé : Marie Martin → Photo : \`marie_martin.png\`

### Format alternatif

Vous pouvez aussi spécifier le nom du fichier photo dans une colonne Excel :
- **Nom fichier photo** (ou \`photo_filename\`) : Nom exact du fichier photo

## Formats de photos supportés

- .jpg / .jpeg
- .png
- .gif
- .webp

## Exemple de fichier Excel

| Prénom | Nom     | Courriel              | Téléphone      | Date d'embauche | Anniversaire |
|--------|---------|-----------------------|----------------|-----------------|--------------|
| Jean   | Dupont  | jean.dupont@ex.com    | +33 6 12 34 56 | 2020-01-15      | 1980-05-15   |
| Marie  | Martin  | marie.martin@ex.com   | +33 6 98 76 54 | 2021-03-20      | 1985-08-22   |

## Processus d'import

1. Téléchargez ce modèle ZIP
2. Décompressez le fichier
3. Remplissez le fichier \`employees.xlsx\` avec vos données
4. Ajoutez les photos dans le dossier \`photos/\` en suivant le format de nommage
5. Recompressez le tout en ZIP
6. Importez le fichier ZIP via l'interface

## Notes importantes

- Les colonnes marquées *REQUIS* doivent être remplies
- Les photos sont automatiquement associées aux employés par leur nom
- Si une photo n'est pas trouvée, l'employé sera créé sans photo
- Le format de date est YYYY-MM-DD pour les dates d'embauche et anniversaires
`;

  zip.file('README.txt', readmeContent);

  // Create photos folder with a placeholder/instructions file
  const photosInstructions = `# Dossier Photos

Placez ici les photos de vos employés.

## Format de nommage

Nommez vos photos selon le format : \`prénom_nom.extension\`

Exemples :
- jean_dupont.jpg
- marie_martin.png
- pierre_durand.jpeg

## Formats acceptés

- .jpg / .jpeg
- .png
- .gif
- .webp

## Important

- Les noms de fichiers doivent être en minuscules
- Utilisez des underscores (_) pour séparer le prénom et le nom
- Le système associera automatiquement les photos aux employés correspondants dans le fichier Excel
`;

  zip.folder('photos')?.file('INSTRUCTIONS.txt', photosInstructions);

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Download the employee ZIP template (Excel + instructions)
 */
export async function downloadEmployeeZipTemplate(): Promise<void> {
  const blob = await generateEmployeeZipTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-employes-avec-photos-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
