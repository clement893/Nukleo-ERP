"""
Invoice PDF Generation Service
Generates PDF documents for finance invoices (facturations)
"""

from io import BytesIO
from typing import Dict, Any, Optional
from datetime import datetime

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
        PageBreak, Image, KeepTogether
    )
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from app.core.logging import logger


class InvoicePDFService:
    """Service for generating invoice PDFs"""
    
    @staticmethod
    def generate_pdf(invoice_data: Dict[str, Any]) -> BytesIO:
        """
        Generate a PDF document from invoice data
        
        Args:
            invoice_data: Dictionary containing invoice information
            
        Returns:
            BytesIO buffer containing the PDF
        """
        if not REPORTLAB_AVAILABLE:
            raise ImportError(
                "reportlab is required for PDF generation. "
                "Install with: pip install reportlab"
            )
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
        story = []
        
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=0,  # Left
            fontName='Helvetica-Bold',
        )
        
        heading_style = ParagraphStyle(
            'InvoiceHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#666666'),
            spaceAfter=8,
            spaceBefore=16,
            fontName='Helvetica-Bold',
        )
        
        body_style = ParagraphStyle(
            'InvoiceBody',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#333333'),
            spaceAfter=8,
            leading=12,
        )
        
        # Header: Invoice Number and Date
        invoice_number = invoice_data.get('invoice_number', 'N/A')
        issue_date = invoice_data.get('issue_date', '')
        if isinstance(issue_date, str):
            try:
                date_obj = datetime.fromisoformat(issue_date.replace('Z', '+00:00'))
                issue_date = date_obj.strftime('%d %B %Y')
            except:
                issue_date = issue_date.split('T')[0] if 'T' in issue_date else issue_date
        
        story.append(Paragraph('FACTURE', title_style))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph(f'<b>Numéro:</b> {invoice_number}', body_style))
        story.append(Paragraph(f'<b>Date d\'émission:</b> {issue_date}', body_style))
        
        due_date = invoice_data.get('due_date', '')
        if due_date:
            if isinstance(due_date, str):
                try:
                    date_obj = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    due_date = date_obj.strftime('%d %B %Y')
                except:
                    due_date = due_date.split('T')[0] if 'T' in due_date else due_date
            story.append(Paragraph(f'<b>Date d\'échéance:</b> {due_date}', body_style))
        
        story.append(Spacer(1, 0.8*cm))
        
        # Client and Company Info (side by side)
        client_data = invoice_data.get('client_data', {})
        if isinstance(client_data, str):
            import json
            try:
                client_data = json.loads(client_data)
            except:
                client_data = {}
        
        # Company info (left) - You can customize this
        company_info = [
            ['<b>ÉMETTEUR</b>', ''],
            ['Nukleo ERP', ''],
            ['', ''],
        ]
        
        # Client info (right)
        client_info = [
            ['<b>CLIENT</b>', ''],
            [client_data.get('name', 'Non spécifié'), ''],
        ]
        
        if client_data.get('email'):
            client_info.append([client_data.get('email', ''), ''])
        if client_data.get('phone'):
            client_info.append([client_data.get('phone', ''), ''])
        if client_data.get('address'):
            client_info.append([client_data.get('address', ''), ''])
        
        # Create two-column layout
        info_table_data = []
        max_rows = max(len(company_info), len(client_info))
        
        for i in range(max_rows):
            row = []
            if i < len(company_info):
                row.append(company_info[i][0])
            else:
                row.append('')
            
            if i < len(client_info):
                row.append(client_info[i][0])
            else:
                row.append('')
            
            info_table_data.append(row)
        
        info_table = Table(info_table_data, colWidths=[9*cm, 9*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 1*cm))
        
        # Line Items Table
        line_items = invoice_data.get('line_items', [])
        if isinstance(line_items, str):
            import json
            try:
                line_items = json.loads(line_items)
            except:
                line_items = []
        
        if line_items:
            story.append(Paragraph('Articles facturés', heading_style))
            
            # Table header
            table_data = [['Description', 'Quantité', 'Prix unitaire', 'Total']]
            
            # Add line items
            for item in line_items:
                description = item.get('description', '')
                quantity = item.get('quantity', 0)
                unit_price = item.get('unitPrice', 0)
                total = item.get('total', 0)
                
                table_data.append([
                    description,
                    str(quantity),
                    f"{float(unit_price):.2f} $",
                    f"{float(total):.2f} $",
                ])
            
            # Totals
            subtotal = float(invoice_data.get('subtotal', 0))
            tax_rate = float(invoice_data.get('tax_rate', 0))
            tax_amount = float(invoice_data.get('tax_amount', 0))
            total = float(invoice_data.get('total', 0))
            
            table_data.append(['', '', '', ''])  # Empty row
            table_data.append(['', '', '<b>Sous-total:</b>', f"<b>{subtotal:.2f} $</b>"])
            
            if tax_rate > 0:
                table_data.append(['', '', f'<b>Taxes ({tax_rate}%):</b>', f"<b>{tax_amount:.2f} $</b>"])
            
            table_data.append(['', '', '<b>TOTAL:</b>', f"<b>{total:.2f} $</b>"])
            
            items_table = Table(
                table_data,
                colWidths=[10*cm, 2.5*cm, 3*cm, 3*cm]
            )
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#000000')),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -5), colors.HexColor('#ffffff')),
                ('TEXTCOLOR', (0, 1), (-1, -5), colors.HexColor('#000000')),
                ('FONTNAME', (0, 1), (-1, -5), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -5), 10),
                ('GRID', (0, 0), (-1, -5), 1, colors.HexColor('#cccccc')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -5), [colors.HexColor('#ffffff'), colors.HexColor('#f9f9f9')]),
                ('FONTNAME', (0, -4), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, -4), (-1, -1), 10),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0f0f0')),
                ('TOPPADDING', (0, -4), (-1, -1), 8),
                ('BOTTOMPADDING', (0, -4), (-1, -1), 8),
            ]))
            
            story.append(items_table)
            story.append(Spacer(1, 0.8*cm))
        
        # Payment Terms
        terms = invoice_data.get('terms', '')
        if terms:
            story.append(Paragraph('Conditions de paiement', heading_style))
            story.append(Paragraph(terms, body_style))
            story.append(Spacer(1, 0.5*cm))
        
        # Notes
        notes = invoice_data.get('notes', '')
        if notes:
            story.append(Paragraph('Notes', heading_style))
            story.append(Paragraph(notes, body_style))
        
        # Payment Status
        status = invoice_data.get('status', 'draft')
        amount_paid = float(invoice_data.get('amount_paid', 0))
        amount_due = float(invoice_data.get('amount_due', 0))
        
        if amount_paid > 0:
            story.append(Spacer(1, 0.5*cm))
            story.append(Paragraph('Statut de paiement', heading_style))
            story.append(Paragraph(f'Montant payé: {amount_paid:.2f} $', body_style))
            story.append(Paragraph(f'Montant dû: {amount_due:.2f} $', body_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return buffer
