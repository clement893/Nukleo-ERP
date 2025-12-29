/**
 * Generate Excel template for contact import
 * Creates a template file with all supported columns and example data
 */

import * as XLSX from 'xlsx';

export interface ContactTemplateColumn {
  key: string;
  label: string;
  description?: string;
  example?: string;
  required?: boolean;
}

export const CONTACT_TEMPLATE_COLUMNS: ContactTemplateColumn[] = [
  {
    key: 'first_name',
    label: 'Prénom',
    description: 'Prénom du contact',
    example: 'Jean',
    required: true,
  },
  {
    key: 'last_name',
    label: 'Nom',
    description: 'Nom de famille du contact',
    example: 'Dupont',
    required: true,
  },
  {
    key: 'email',
    label: 'Courriel',
    description: 'Adresse email du contact',
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
    key: 'company_id',
    label: 'ID Entreprise',
    description: 'Identifiant de l\'entreprise (optionnel)',
    example: '1',
    required: false,
  },
  {
    key: 'position',
    label: 'Poste',
    description: 'Poste occupé',
    example: 'Directeur Commercial',
    required: false,
  },
  {
    key: 'circle',
    label: 'Cercle',
    description: 'Cercle du contact (client, prospect, partenaire, fournisseur, autre)',
    example: 'client',
    required: false,
  },
  {
    key: 'city',
    label: 'Ville',
    description: 'Ville du contact',
    example: 'Paris',
    required: false,
  },
  {
    key: 'country',
    label: 'Pays',
    description: 'Pays du contact',
    example: 'France',
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
    key: 'birthday',
    label: 'Anniversaire',
    description: 'Date d\'anniversaire (format: YYYY-MM-DD)',
    example: '1980-05-15',
    required: false,
  },
  {
    key: 'language',
    label: 'Langue',
    description: 'Code langue (fr, en, es, etc.)',
    example: 'fr',
    required: false,
  },
  {
    key: 'employee_id',
    label: 'ID Employé',
    description: 'Identifiant de l\'employé assigné (optionnel)',
    example: '1',
    required: false,
  },
];

/**
 * Generate Excel template file for contact import
 * @returns Blob containing the Excel file
 */
export function generateContactTemplate(): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create header row with labels
  const headers = CONTACT_TEMPLATE_COLUMNS.map(col => col.label);
  
  // Create example data row
  const exampleRow = CONTACT_TEMPLATE_COLUMNS.map(col => col.example || '');

  // Create worksheet data
  const wsData = [
    headers,
    exampleRow,
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  const colWidths = CONTACT_TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));
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
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts');

  // Create instructions sheet
  const instructionsData = [
    ['Instructions pour l\'import de contacts'],
    [''],
    ['Colonnes supportées:'],
    ...CONTACT_TEMPLATE_COLUMNS.map(col => [
      `- ${col.label} (${col.key})${col.required ? ' *REQUIS*' : ''}`,
      col.description || '',
      col.example ? `Exemple: ${col.example}` : '',
    ]),
    [''],
    ['Notes importantes:'],
    ['- Les colonnes marquées *REQUIS* doivent être remplies'],
    ['- Le format de date pour l\'anniversaire est YYYY-MM-DD (ex: 1980-05-15)'],
    ['- Les cercles acceptés sont: client, prospect, partenaire, fournisseur, autre'],
    ['- Les IDs (company_id, employee_id) doivent correspondre à des enregistrements existants'],
    ['- Vous pouvez utiliser les noms de colonnes en français ou en anglais'],
    [''],
    ['Format des colonnes acceptées:'],
    ['Français: Prénom, Nom, Courriel, Téléphone, Poste, Cercle, Ville, Pays, LinkedIn, Anniversaire, Langue'],
    ['Anglais: first_name, last_name, email, phone, position, circle, city, country, linkedin, birthday, language'],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // Convert to blob
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download the contact template Excel file
 */
export function downloadContactTemplate(): void {
  const blob = generateContactTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-contacts-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
