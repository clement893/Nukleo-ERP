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
    ['- ID Pipeline : Doit être un UUID valide d\'un pipeline existant (trouvable dans Module Commercial > Pipeline Client)'],
    ['- ID Stade du pipeline : Doit être un UUID valide d\'un stade appartenant au pipeline spécifié'],
    ['- Le stade doit appartenir au pipeline spécifié dans "ID Pipeline"'],
    ['- Pour "Statut", utilisez: open, qualified, proposal, negotiation, won, lost, cancelled'],
    ['- Les IDs (pipeline_id, stage_id, company_id, assigned_to_id) doivent correspondre à des enregistrements existants'],
    ['- Pour "IDs Contacts", séparez plusieurs IDs par des virgules (ex: 1,2,3)'],
    ['- Les dates doivent être au format YYYY-MM-DD'],
    ['- Vous pouvez utiliser soit "ID Entreprise" soit "Nom Entreprise" pour lier une entreprise'],
    ['- Si vous utilisez "Nom Entreprise", le système tentera de faire correspondre le nom'],
    ['- Si vous ne spécifiez pas de stade, l\'opportunité sera créée sans stade assigné (vous pourrez l\'assigner plus tard)'],
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

/**
 * Generate ZIP template with Excel file and instructions for importing opportunities
 * @returns Blob containing the ZIP file
 */
export async function generateOpportunityZipTemplate(): Promise<Blob> {
  // Import JSZip dynamically to avoid SSR issues
  const JSZipModule = await import('jszip') as any;
  const JSZip = JSZipModule.default || JSZipModule;
  const zip = new JSZip();

  // Generate Excel template
  const excelBlob = generateOpportunityTemplate();
  const excelArrayBuffer = await excelBlob.arrayBuffer();
  zip.file('opportunites.xlsx', excelArrayBuffer);

  // Create README with instructions
  const readmeContent = `# Instructions pour l'import d'opportunités

## Structure du fichier ZIP

Votre fichier ZIP doit contenir :
- \`opportunites.xlsx\` : Fichier Excel avec les données des opportunités

## Structure recommandée

\`\`\`
opportunites_import.zip
└── opportunites.xlsx
\`\`\`

## Format du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

### Colonnes requises
- **Nom de l'opportunité** (ou \`name\`) : Nom de l'opportunité commerciale *REQUIS*
- **ID Pipeline** (ou \`pipeline_id\`) : Identifiant UUID du pipeline *REQUIS*

### Colonnes optionnelles
- **Description** (ou \`description\`) : Description détaillée de l'opportunité
- **Montant** (ou \`amount\`) : Montant en euros
- **Probabilité (%)** (ou \`probability\`) : Probabilité de succès (0-100)
- **Statut** (ou \`status\`) : open, qualified, proposal, negotiation, won, lost, cancelled
- **ID Stade du pipeline** (ou \`stage_id\`) : Identifiant UUID du stade du pipeline (le stade doit appartenir au pipeline spécifié)
- **ID Entreprise** (ou \`company_id\`) : Identifiant de l'entreprise cliente
- **Nom Entreprise** (ou \`company_name\`) : Nom de l'entreprise (alternative à ID Entreprise)
- **IDs Contacts** (ou \`contact_ids\`) : IDs des contacts liés (séparés par virgule)
- **ID Assigné à** (ou \`assigned_to_id\`) : Identifiant de l'utilisateur assigné
- **Date de clôture prévue** (ou \`expected_close_date\`) : Date au format YYYY-MM-DD
- **Date d'ouverture** (ou \`opened_at\`) : Date d'ouverture au format YYYY-MM-DD
- **Date de fermeture** (ou \`closed_at\`) : Date de fermeture au format YYYY-MM-DD
- **Segment** (ou \`segment\`) : Segment de marché
- **Région** (ou \`region\`) : Région géographique
- **Lien offre de service** (ou \`service_offer_link\`) : URL vers l'offre de service
- **Notes internes** (ou \`notes\`) : Notes internes sur l'opportunité
- **Commentaires publics** (ou \`comments\`) : Commentaires publics ou remarques

## Pipeline et Stade du Pipeline

### Pipeline (REQUIS)

Chaque opportunité doit être associée à un **pipeline**. Le pipeline représente le processus commercial que suit l'opportunité.

**Comment trouver l'ID du pipeline :**
1. Connectez-vous à l'application
2. Allez dans "Module Commercial" > "Pipeline Client"
3. Consultez la liste des pipelines disponibles
4. L'ID du pipeline est un UUID (ex: \`550e8400-e29b-41d4-a716-446655440000\`)

**Important :** L'ID Pipeline est **OBLIGATOIRE** pour chaque opportunité.

### Stade du Pipeline (Optionnel)

Le stade représente l'étape actuelle de l'opportunité dans le pipeline. Chaque pipeline contient plusieurs stades (ex: "Qualification", "Proposition", "Négociation", etc.).

**Comment trouver l'ID du stade :**
1. Ouvrez le pipeline concerné dans "Module Commercial" > "Pipeline Client"
2. Consultez les stades disponibles dans ce pipeline
3. L'ID du stade est un UUID (ex: \`660e8400-e29b-41d4-a716-446655440001\`)

**Important :** 
- Le stade doit appartenir au pipeline spécifié dans "ID Pipeline"
- Si vous ne spécifiez pas de stade, l'opportunité sera créée sans stade assigné
- Vous pouvez modifier le stade plus tard depuis l'interface

**Relation Pipeline ↔ Stade :**
- Un pipeline contient plusieurs stades
- Chaque stade appartient à un seul pipeline
- L'ID du stade doit correspondre à un stade du pipeline spécifié

## Exemple de fichier Excel

| Nom de l'opportunité | Description | Montant | Probabilité (%) | Statut | ID Pipeline | ID Stade du pipeline | Nom Entreprise |
|---------------------|-------------|---------|-----------------|--------|-------------|---------------------|----------------|
| Projet Digital Transformation | Mise en place CRM | 50000 | 75 | qualified | 550e8400-e29b-41d4-a716-446655440000 | 660e8400-e29b-41d4-a716-446655440001 | Acme Corporation |
| Solution Cloud | Migration vers le cloud | 100000 | 60 | proposal | 550e8400-e29b-41d4-a716-446655440000 | 660e8400-e29b-41d4-a716-446655440002 | Tech Solutions |

**Note :** Dans cet exemple, les deux opportunités utilisent le même pipeline mais des stades différents.

## Processus d'import

1. Téléchargez ce modèle ZIP
2. Décompressez le fichier
3. **Identifiez les IDs de vos pipelines et stades** depuis l'interface
4. Modifiez le fichier \`opportunites.xlsx\` avec vos données
5. Assurez-vous que chaque "ID Stade du pipeline" correspond bien à un stade du "ID Pipeline" spécifié
6. Recompressez le tout en ZIP
7. Importez le fichier ZIP via l'interface

## Notes importantes

- Les colonnes marquées *REQUIS* doivent être remplies
- **ID Pipeline** : Doit être un UUID valide d'un pipeline existant dans le système
- **ID Stade du pipeline** : Doit être un UUID valide d'un stade appartenant au pipeline spécifié
- Les IDs (pipeline_id, stage_id, company_id, assigned_to_id) doivent correspondre à des enregistrements existants dans le système
- Pour "IDs Contacts", séparez plusieurs IDs par des virgules (ex: 1,2,3)
- Les dates doivent être au format YYYY-MM-DD
- Si vous ne connaissez pas l'ID d'un stade, vous pouvez laisser la colonne vide et l'assigner plus tard depuis l'interface

## Support

En cas de problème lors de l'import, vérifiez :
- Le format du fichier Excel (doit être .xlsx ou .xls)
- Les colonnes requises sont présentes et remplies
- L'ID Pipeline est valide et existe dans le système
- L'ID Stade du pipeline (si fourni) appartient bien au pipeline spécifié
- Le format de date (YYYY-MM-DD)
- Les IDs correspondent à des enregistrements existants
`;

  zip.file('README.txt', readmeContent);

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Download the opportunity ZIP template (Excel + instructions)
 */
export async function downloadOpportunityZipTemplate(): Promise<void> {
  const blob = await generateOpportunityZipTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-opportunites-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}