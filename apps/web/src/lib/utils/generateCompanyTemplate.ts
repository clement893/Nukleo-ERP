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
