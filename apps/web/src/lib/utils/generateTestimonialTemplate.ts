/**
 * Generate Testimonial Import Template
 * Creates Excel template for importing testimonials
 */

import * as XLSX from 'xlsx';

/**
 * Generate Excel template for testimonials import
 */
export function generateTestimonialTemplate(): Blob {
  // Define columns with headers
  const headers = [
    'Entreprise',
    'ID Entreprise',
    'Prénom Contact',
    'Nom Contact',
    'ID Contact',
    'Titre',
    'Témoignage FR',
    'Témoignage EN',
    'Langue',
    'Nom Fichier Logo',
    'URL Logo',
    'Publié',
    'Note',
  ];

  // Create sample data row
  const sampleRow = [
    'Acme Corp', // Entreprise
    '', // ID Entreprise (optional)
    'Jean', // Prénom Contact
    'Dupont', // Nom Contact
    '', // ID Contact (optional)
    'Excellent service', // Titre
    'Service exceptionnel, je recommande vivement.', // Témoignage FR
    'Exceptional service, I highly recommend.', // Témoignage EN
    'fr', // Langue
    'acme_logo.png', // Nom Fichier Logo (for ZIP matching)
    '', // URL Logo (optional if using ZIP)
    'true', // Publié (true/false)
    '5', // Note (1-5)
  ];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

  // Set column widths
  const columnWidths = [
    { wch: 20 }, // Entreprise
    { wch: 12 }, // ID Entreprise
    { wch: 15 }, // Prénom Contact
    { wch: 15 }, // Nom Contact
    { wch: 12 }, // ID Contact
    { wch: 25 }, // Titre
    { wch: 50 }, // Témoignage FR
    { wch: 50 }, // Témoignage EN
    { wch: 10 }, // Langue
    { wch: 20 }, // Nom Fichier Logo
    { wch: 30 }, // URL Logo
    { wch: 10 }, // Publié
    { wch: 5 },  // Note
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Témoignages');

  // Convert to blob
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Download Excel template for testimonials import
 */
export function downloadTestimonialTemplate(): void {
  const blob = generateTestimonialTemplate();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modele_import_temoignages.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Generate ZIP template for testimonials import (Excel + logos folder)
 */
export async function generateTestimonialZipTemplate(): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Generate Excel file
  const excelBlob = generateTestimonialTemplate();
  const excelArrayBuffer = await excelBlob.arrayBuffer();
  zip.file('temoignages.xlsx', excelArrayBuffer);

  // Create logos folder with README
  const readmeContent = `# Dossier Logos

Placez les logos des entreprises dans ce dossier.

Nommage recommandé:
- Utilisez le nom de l'entreprise (ex: acme_corp.png)
- Ou utilisez le nom exact spécifié dans la colonne "Nom Fichier Logo" du fichier Excel

Formats supportés: .jpg, .jpeg, .png, .gif, .webp, .svg

Exemple:
- acme_corp.png
- tech_company.jpg
- startup_logo.svg
`;
  zip.file('logos/README.txt', readmeContent);

  // Generate ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Download ZIP template for testimonials import (Excel + logos folder)
 */
export async function downloadTestimonialZipTemplate(): Promise<void> {
  const zipBlob = await generateTestimonialZipTemplate();
  const url = window.URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modele_import_temoignages.zip';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
