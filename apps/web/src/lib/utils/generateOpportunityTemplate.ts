/**
 * Generate Excel template for opportunity import
 * Creates a template file with all supported columns and example data
 */

import * as XLSX from 'xlsx';

export interface OpportunityTemplateColumn {
  key: string;
  label: string;
  description?: string;
  example?: string;
  required?: boolean;
}

export const OPPORTUNITY_TEMPLATE_COLUMNS: OpportunityTemplateColumn[] = [
  {
    key: 'name',
    label: 'Nom de l\'opportunité',
    description: 'Nom de l\'opportunité commerciale',
    example: 'Projet Digital Transformation',
    required: true,
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Description détaillée de l\'opportunité',
    example: 'Mise en place d\'une solution CRM pour améliorer la gestion client',
    required: false,
  },
  {
    key: 'amount',
    label: 'Montant',
    description: 'Montant de l\'opportunité en euros',
    example: '50000',
    required: false,
  },
  {
    key: 'probability',
    label: 'Probabilité (%)',
    description: 'Probabilité de succès (0-100)',
    example: '75',
    required: false,
  },
  {
    key: 'status',
    label: 'Statut',
    description: 'Statut: open, qualified, proposal, negotiation, won, lost, cancelled',
    example: 'qualified',
    required: false,
  },
  {
    key: 'pipeline_id',
    label: 'ID Pipeline',
    description: 'Identifiant du pipeline (REQUIS)',
    example: 'uuid-du-pipeline',
    required: true,
  },
  {
    key: 'stage_id',
    label: 'ID Stade du pipeline',
    description: 'Identifiant du stade du pipeline',
    example: 'uuid-du-stade',
    required: false,
  },
  {
    key: 'company_id',
    label: 'ID Entreprise',
    description: 'Identifiant de l\'entreprise cliente',
    example: '1',
    required: false,
  },
  {
    key: 'company_name',
    label: 'Nom Entreprise',
    description: 'Nom de l\'entreprise (alternative à ID Entreprise)',
    example: 'Acme Corporation',
    required: false,
  },
  {
    key: 'contact_ids',
    label: 'IDs Contacts',
    description: 'IDs des contacts liés (séparés par virgule)',
    example: '1,2,3',
    required: false,
  },
  {
    key: 'assigned_to_id',
    label: 'ID Assigné à',
    description: 'Identifiant de l\'utilisateur assigné',
    example: '1',
    required: false,
  },
  {
    key: 'expected_close_date',
    label: 'Date de clôture prévue',
    description: 'Date au format YYYY-MM-DD',
    example: '2024-12-31',
    required: false,
  },
  {
    key: 'opened_at',
    label: 'Date d\'ouverture',
    description: 'Date d\'ouverture au format YYYY-MM-DD',
    example: '2024-01-15',
    required: false,
  },
  {
    key: 'closed_at',
    label: 'Date de fermeture',
    description: 'Date de fermeture au format YYYY-MM-DD',
    example: '2024-12-31',
    required: false,
  },
  {
    key: 'segment',
    label: 'Segment',
    description: 'Segment de marché',
    example: 'PME',
    required: false,
  },
  {
    key: 'region',
    label: 'Région',
    description: 'Région géographique',
    example: 'Île-de-France',
    required: false,
  },
  {
    key: 'service_offer_link',
    label: 'Lien offre de service',
    description: 'URL vers l\'offre de service',
    example: 'https://example.com/offre',
    required: false,
  },
  {
    key: 'notes',
    label: 'Notes internes',
    description: 'Notes internes sur l\'opportunité',
    example: 'Client très intéressé, besoin de suivi régulier',
    required: false,
  },
  {
    key: 'comments',
    label: 'Commentaires publics',
    description: 'Commentaires publics ou remarques',
    example: 'Opportunité prometteuse',
    required: false,
  },
];

/**
 * Generate Excel template file for opportunity import
 * @returns Blob containing the Excel file
 */
export function generateOpportunityTemplate(): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create header row with labels
  const headers = OPPORTUNITY_TEMPLATE_COLUMNS.map(col => col.label);
  
  // Create example data row
  const exampleRow = OPPORTUNITY_TEMPLATE_COLUMNS.map(col => col.example || '');

  // Create worksheet data
  const wsData = [
    headers,
    exampleRow,
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  const colWidths = OPPORTUNITY_TEMPLATE_COLUMNS.map(() => ({ wch: 25 }));
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
  XLSX.utils.book_append_sheet(wb, ws, 'Opportunités');

  // Create instructions sheet
  const instructionsData = [
    ['Instructions pour l\'import d\'opportunités'],
    [''],
    ['Colonnes supportées:'],
    ...OPPORTUNITY_TEMPLATE_COLUMNS.map(col => [
      `- ${col.label} (${col.key})${col.required ? ' *REQUIS*' : ''}`,
      col.description || '',
      col.example ? `Exemple: ${col.example}` : '',
    ]),
    [''],
    ['Notes importantes:'],
    ['- Les colonnes "Nom de l\'opportunité" et "ID Pipeline" sont REQUISES'],
    ['- Pour "Statut", utilisez: open, qualified, proposal, negotiation, won, lost, cancelled'],
    ['- Les IDs (pipeline_id, stage_id, company_id, assigned_to_id) doivent correspondre à des enregistrements existants'],
    ['- Pour "IDs Contacts", séparez plusieurs IDs par des virgules (ex: 1,2,3)'],
    ['- Les dates doivent être au format YYYY-MM-DD'],
    ['- Vous pouvez utiliser soit "ID Entreprise" soit "Nom Entreprise" pour lier une entreprise'],
    ['- Si vous utilisez "Nom Entreprise", le système tentera de faire correspondre le nom'],
    [''],
    ['Format des colonnes acceptées:'],
    ['Français: Nom de l\'opportunité, Description, Montant, Probabilité (%), Statut, ID Pipeline, ID Stade du pipeline, ID Entreprise, Nom Entreprise, IDs Contacts, ID Assigné à, Date de clôture prévue, Date d\'ouverture, Date de fermeture, Segment, Région, Lien offre de service, Notes internes, Commentaires publics'],
    ['Anglais: name, description, amount, probability, status, pipeline_id, stage_id, company_id, company_name, contact_ids, assigned_to_id, expected_close_date, opened_at, closed_at, segment, region, service_offer_link, notes, comments'],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // Convert to blob
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download the opportunity template Excel file
 */
export function downloadOpportunityTemplate(): void {
  const blob = generateOpportunityTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-opportunites-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
