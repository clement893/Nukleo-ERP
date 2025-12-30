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
    key: 'logo_filename',
    label: 'Nom fichier logo',
    description: 'Nom exact du fichier logo dans le ZIP (alternative à logo_url)',
    example: 'acme_corporation.jpg',
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

  // Create instructions sheet with detailed information
  const instructionsData = [
    ['Instructions pour l\'import d\'entreprises'],
    [''],
    ['=== COLONNES REQUISES ==='],
    ['- Nom de l\'entreprise (name, nom, nom de l\'entreprise) *REQUIS*'],
    [''],
    ['=== COLONNES OPTIONNELLES ==='],
    [''],
    ['Informations principales:'],
    ['- Description (description)'],
    ['- Site web (website, site web, site internet, url)'],
    ['- Logo URL (S3) (logo_url, logo, logo url, image_url)'],
    [''],
    ['Contact:'],
    ['- Courriel (email, courriel, e-mail, mail)'],
    ['- Téléphone (phone, téléphone, telephone, tel)'],
    ['- Adresse (address, adresse)'],
    ['- Ville (city, ville)'],
    ['- Pays (country, pays)'],
    [''],
    ['Statut et relations:'],
    ['- Client (Y/N) (is_client, client, est client, is client)'],
    ['- ID Entreprise parente (parent_company_id, id entreprise parente)'],
    [''],
    ['Réseaux sociaux:'],
    ['- Facebook (facebook, facebook_url, page facebook)'],
    ['- Instagram (instagram, instagram_url, profil instagram)'],
    ['- LinkedIn (linkedin, linkedin_url, profil linkedin)'],
    [''],
    ['=== FORMAT CLIENT (Y/N) ==='],
    ['Valeurs acceptées pour "Oui" (client):'],
    ['- Oui, Yes, True, 1, Vrai, O'],
    [''],
    ['Valeurs acceptées pour "Non" (non-client):'],
    ['- Non, No, False, 0, Faux, N'],
    [''],
    ['=== LOGOS ==='],
    ['Option 1: Logo dans le ZIP'],
    ['- Placez les logos dans un dossier "logos/" dans le ZIP'],
    ['- Nommez les fichiers selon le nom de l\'entreprise (normalisé)'],
    ['- Exemple: logos/acme_corporation.jpg'],
    [''],
    ['Option 2: Logo URL S3'],
    ['- Indiquez l\'URL S3 dans la colonne "Logo URL (S3)"'],
    ['- Format: companies/logos/acme.jpg ou URL complète'],
    [''],
    ['Option 3: Nom de fichier explicite'],
    ['- Ajoutez une colonne "logo_filename" ou "nom_fichier_logo"'],
    ['- Indiquez le nom exact du fichier logo'],
    [''],
    ['=== ENTREPRISES PARENTES (FILIALES) ==='],
    ['- Utilisez la colonne "ID Entreprise parente" pour créer une filiale'],
    ['- L\'entreprise parente doit exister dans la base de données'],
    ['- Trouvez l\'ID dans la liste des entreprises'],
    [''],
    ['=== NOTES IMPORTANTES ==='],
    ['- Les noms de colonnes sont insensibles à la casse et aux accents'],
    ['- Les entreprises existantes seront mises à jour si le nom correspond'],
    ['- Les logos seront automatiquement uploadés vers S3 si présents dans le ZIP'],
    ['- Si Client (Y/N) = Oui, l\'entreprise sera créée dans la liste des clients'],
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

  // Create README with comprehensive instructions
  const readmeContent = `# Instructions pour l'import d'entreprises avec logos

## 📦 Structure du fichier ZIP

Votre fichier ZIP doit contenir :
- \`entreprises.xlsx\` : Fichier Excel avec les données des entreprises
- \`logos/\` : Dossier contenant les logos des entreprises (optionnel)

## 📁 Structure recommandée

\`\`\`
entreprises_import.zip
├── entreprises.xlsx
└── logos/
    ├── acme_corporation.jpg
    ├── tech_solutions.png
    └── example_company.jpeg
\`\`\`

## 📊 Format du fichier Excel

### Colonnes requises
- **Nom de l'entreprise** (ou \`name\`, \`nom\`) : Nom de l'entreprise *REQUIS*

### Colonnes optionnelles

#### Informations principales
- **Description** (ou \`description\`) : Description de l'entreprise
- **Site web** (ou \`website\`, \`site web\`, \`site internet\`, \`url\`) : URL du site web
- **Logo URL (S3)** (ou \`logo_url\`, \`logo\`, \`logo url\`, \`image_url\`) : URL S3 ou nom du fichier

#### Contact
- **Courriel** (ou \`email\`, \`courriel\`, \`e-mail\`, \`mail\`) : Adresse email
- **Téléphone** (ou \`phone\`, \`téléphone\`, \`telephone\`, \`tel\`) : Numéro de téléphone
- **Adresse** (ou \`address\`, \`adresse\`) : Adresse complète
- **Ville** (ou \`city\`, \`ville\`) : Ville
- **Pays** (ou \`country\`, \`pays\`) : Pays de l'entreprise

#### Statut et relations
- **Client (Y/N)** (ou \`is_client\`, \`client\`, \`est client\`, \`is client\`) : Oui/Non
- **ID Entreprise parente** (ou \`parent_company_id\`, \`id entreprise parente\`) : ID de l'entreprise parente (si filiale)

#### Réseaux sociaux
- **Facebook** (ou \`facebook\`, \`facebook_url\`, \`page facebook\`) : URL Facebook
- **Instagram** (ou \`instagram\`, \`instagram_url\`, \`profil instagram\`) : URL Instagram
- **LinkedIn** (ou \`linkedin\`, \`linkedin_url\`, \`profil linkedin\`) : URL LinkedIn

## ✅ Format Client (Y/N)

Les valeurs acceptées pour "Client (Y/N)" sont :

**Pour "Oui" (client):**
- Oui, Yes, True, 1, Vrai, O

**Pour "Non" (non-client):**
- Non, No, False, 0, Faux, N

## 🖼️ Logos

### Option 1 : Logo dans le ZIP (recommandé)
1. Placez les logos dans un dossier \`logos/\` dans le ZIP
2. Nommez les fichiers selon le nom de l'entreprise (normalisé : minuscules, sans accents, espaces remplacés par _)
3. Exemple : \`logos/acme_corporation.jpg\`
4. Formats acceptés : .jpg, .jpeg, .png, .gif, .webp

### Option 2 : Nom de fichier explicite (recommandé)
1. Ajoutez une colonne **"Nom fichier logo"** (ou \`logo_filename\`, \`nom_fichier_logo\`) dans l'Excel
2. Indiquez le nom exact du fichier logo (ex: \`acme_corporation.jpg\`)
3. Le fichier doit être présent dans le dossier \`logos/\` du ZIP
4. Cette méthode a la priorité la plus élevée et permet un matching précis

### Option 3 : Logo URL S3
1. Indiquez l'URL S3 complète dans la colonne "Logo URL (S3)"
2. Format : \`companies/logos/acme.jpg\` ou URL complète S3

**Exemple de nommage automatique:**
- Entreprise : "Acme Corporation" → Logo : \`acme_corporation.jpg\`
- Entreprise : "Tech Solutions Inc." → Logo : \`tech_solutions_inc.jpg\`

## 🏢 Entreprises parentes (filiales)

Pour créer une filiale :
1. L'entreprise parente doit exister dans la base de données
2. Trouvez l'ID de l'entreprise parente dans la liste des entreprises
3. Utilisez la colonne "ID Entreprise parente" avec cet ID
4. La filiale sera automatiquement liée à l'entreprise parente

**Exemple:**
- Entreprise parente : "Acme Corporation" (ID: 1)
- Filiale : "Acme France" avec "ID Entreprise parente" = 1

## 📝 Exemple de fichier Excel

| Nom de l'entreprise | Site web | Pays | Client (Y/N) | logo_filename |
|---------------------|----------|------|-------------|---------------|
| Acme Corporation | https://www.acme.com | France | Oui | acme_corporation.jpg |
| Tech Solutions | https://tech-solutions.com | Canada | Non | tech_solutions.png |

## ⚠️ Notes importantes

- **Noms de colonnes** : Insensibles à la casse et aux accents (ex: "Nom", "nom", "NOM" sont acceptés)
- **Mise à jour** : Les entreprises existantes seront mises à jour si le nom correspond exactement
- **Upload automatique** : Les logos seront automatiquement uploadés vers S3 si présents dans le ZIP
- **Création client** : Si Client (Y/N) = Oui, l'entreprise sera automatiquement créée dans la liste des clients
- **Entreprises parentes** : L'entreprise parente doit exister avant l'import de la filiale
- **S3 requis** : Assurez-vous que S3 est configuré pour que les logos soient uploadés correctement

## 🔄 Processus d'import

1. Téléchargez ce modèle ZIP
2. Décompressez le fichier
3. Remplissez le fichier \`entreprises.xlsx\` avec vos données
4. Ajoutez les logos dans le dossier \`logos/\` en suivant le format de nommage
5. Recompressez le tout en ZIP
6. Importez le fichier ZIP via l'interface

## 🆘 Support

En cas de problème lors de l'import, vérifiez :
- Le format du fichier Excel (doit être .xlsx ou .xls)
- Le nommage des logos (doit correspondre au format nom_entreprise)
- Les colonnes requises sont présentes et remplies
- L'entreprise parente existe si vous créez une filiale
- S3 est configuré correctement pour l'upload des logos
`;

  zip.file('README.md', readmeContent);

  // Create logos folder with instructions file
  const logosInstructions = `# Dossier Logos

Placez ici les logos de vos entreprises.

## Format de nommage

Nommez vos logos selon le format : \`nom_entreprise.extension\`

Le nom de l'entreprise sera normalisé automatiquement :
- Accents supprimés
- Espaces remplacés par des underscores (_)
- Converti en minuscules

Exemples :
- Entreprise : "Acme Corporation" → Logo : acme_corporation.jpg
- Entreprise : "Tech Solutions Inc." → Logo : tech_solutions_inc.jpg
- Entreprise : "Éxample & Co" → Logo : example_co.jpg

## Formats acceptés

- .jpg / .jpeg
- .png
- .gif
- .webp

## Important

- Les noms de fichiers doivent être en minuscules
- Utilisez des underscores (_) pour séparer les mots
- Le système associera automatiquement les logos aux entreprises correspondantes dans le fichier Excel
- Vous pouvez aussi spécifier le nom du fichier dans une colonne Excel : \`logo_filename\` ou \`nom_fichier_logo\`
`;
  
  zip.folder('logos')?.file('INSTRUCTIONS.txt', logosInstructions);

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
