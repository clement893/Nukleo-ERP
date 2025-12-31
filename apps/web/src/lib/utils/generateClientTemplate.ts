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
    description: 'Nom de l\'entreprise (sera matché si existe, sinon créée)',
    example: 'Acme Corporation',
    required: true,
  },
  {
    key: 'company_id',
    label: 'ID Entreprise',
    description: 'Identifiant de l\'entreprise (optionnel, si fourni, company_name sera ignoré)',
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
    key: 'responsable_id',
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
    description: 'Commentaires sur le client',
    example: 'À contacter régulièrement',
    required: false,
  },
  {
    key: 'portal_url',
    label: 'URL Portail',
    description: 'URL du portail client',
    example: 'https://portail.client.com',
    required: false,
  },
  {
    key: 'logo_filename',
    label: 'Nom fichier logo',
    description: 'Nom du fichier logo dans le dossier logos/',
    example: 'acme_corporation.jpg',
    required: false,
  },
];

/**
 * Generate Excel template for client import
 * @returns Blob containing the Excel file
 */
export function generateClientTemplate(): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet data
  const headers = CLIENT_TEMPLATE_COLUMNS.map(col => col.label);
  const examples = CLIENT_TEMPLATE_COLUMNS.map(col => col.example || '');
  
  // Add header row
  const wsData = [headers, examples];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidths = CLIENT_TEMPLATE_COLUMNS.map(() => ({ wch: 25 }));
  ws['!cols'] = colWidths;
  
  // Style header row (bold)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.s.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E0E0E0' } },
    };
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
  const JSZipModule = await import('jszip') as any;
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
    ├── acme_corporation.jpg
    ├── tech_solutions.png
    └── ...
\`\`\`

## Format du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

### Colonnes requises
- **Nom de l'entreprise** (ou \`company_name\`, \`entreprise\`, \`nom_entreprise\`) : Nom de l'entreprise *REQUIS*

### Colonnes optionnelles
- **ID Entreprise** (ou \`company_id\`, \`id_entreprise\`) : Identifiant de l'entreprise (si fourni, le nom sera ignoré)
- **Statut** (ou \`status\`, \`statut\`) : actif, inactif, maintenance (défaut: actif)
- **ID Responsable** (ou \`responsable_id\`, \`employee_id\`) : Identifiant de l'employé responsable
- **Notes** (ou \`notes\`, \`note\`) : Notes sur le client
- **Commentaires** (ou \`comments\`, \`commentaires\`) : Commentaires sur le client
- **URL Portail** (ou \`portal_url\`, \`url_portail\`) : URL du portail client
- **Nom fichier logo** (ou \`logo_filename\`, \`nom_fichier_logo\`) : Nom du fichier logo dans le dossier logos/

## Matching des entreprises

Le système fait un matching intelligent par nom d'entreprise :
1. **Match exact** (insensible à la casse)
2. **Match sans forme juridique** (SARL, SA, SAS, EURL)
3. **Match partiel** (contient)

Si une entreprise existe déjà, elle sera liée au client et le tag "client" sera ajouté.
Si l'entreprise n'existe pas, elle sera créée automatiquement avec le tag "client".

## Nommage des logos

Les logos doivent être nommés selon le nom de l'entreprise (normalisé) :
- \`nom_entreprise.jpg\` (ex: \`acme_corporation.jpg\`)
- \`nom_entreprise.png\`
- \`nom_entreprise.jpeg\`

**Exemples :**
- Entreprise : Acme Corporation → Logo : \`acme_corporation.jpg\`
- Entreprise : Tech Solutions SARL → Logo : \`tech_solutions.jpg\`

### Format alternatif (recommandé)

Vous pouvez aussi spécifier le nom du fichier logo dans une colonne Excel :
- **Nom fichier logo** (ou \`logo_filename\`, \`nom_fichier_logo\`) : Nom exact du fichier logo

Cette méthode a la priorité la plus élevée et permet un matching précis même si le nom de l'entreprise ne correspond pas exactement au nom du fichier.

## Formats de logos supportés

- .jpg / .jpeg
- .png
- .gif
- .webp

## Exemple de fichier Excel

| Nom de l'entreprise | Statut | ID Responsable | Notes                    | Commentaires              | URL Portail                    | Nom fichier logo        |
|---------------------|--------|----------------|--------------------------|---------------------------|--------------------------------|--------------------------|
| Acme Corporation    | actif  | 1              | Client important         | À contacter régulièrement | https://portail.acme.com       | acme_corporation.jpg    |
| Tech Solutions      | actif  | 2              | Nouveau client           | Premier contact réussi    | https://portail.tech.com       | tech_solutions.png      |

## Processus d'import

1. Téléchargez ce modèle ZIP
2. Décompressez le fichier
3. Remplissez le fichier \`clients.xlsx\` avec vos données
4. Ajoutez les logos dans le dossier \`logos/\` en suivant le format de nommage
5. Recompressez le tout en ZIP
6. Importez le fichier ZIP via l'interface

## Notes importantes

- Les colonnes marquées *REQUIS* doivent être remplies
- Les logos sont automatiquement associés aux entreprises par leur nom
- Si un logo n'est pas trouvé, le client sera créé sans logo
- Vous pouvez utiliser soit des logos dans le ZIP, soit des URLs dans la colonne Logo URL (si supporté)
- Les IDs (company_id, responsable_id) doivent correspondre à des enregistrements existants dans le système
- Le matching des entreprises se fait par nom, pas par ID (sauf si company_id est fourni)

## Support

En cas de problème lors de l'import, vérifiez :
- Le format du fichier Excel (doit être .xlsx ou .xls)
- Le nommage des logos (doit correspondre au format nom_entreprise)
- Les colonnes requises sont présentes et remplies
- Le format du statut (actif, inactif, maintenance)
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
- Utilisez des underscores (_) pour séparer les mots
- Le système associera automatiquement les logos aux entreprises correspondantes dans le fichier Excel
- Vous pouvez aussi spécifier le nom du fichier dans la colonne "Nom fichier logo" du fichier Excel
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
  link.download = `modele-import-clients-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
