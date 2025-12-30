"""
Submission PDF Generation Service
Generates complex PDF documents for commercial submissions
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


class SubmissionPDFService:
    """Service for generating submission PDFs"""
    
    @staticmethod
    def generate_pdf(submission_data: Dict[str, Any]) -> BytesIO:
        """
        Generate a PDF document from submission data
        
        Args:
            submission_data: Dictionary containing submission content
            
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
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=1,  # Center
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#666666'),
            spaceAfter=20,
            alignment=1,  # Center
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=12,
            spaceBefore=20,
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12,
            leading=14,
        )
        
        content = submission_data.get('content', {})
        
        # Cover Page
        cover = content.get('cover', {})
        if cover:
            story.append(Spacer(1, 3*cm))
            story.append(Paragraph(cover.get('title', ''), title_style))
            if cover.get('subtitle'):
                story.append(Spacer(1, 0.5*cm))
                story.append(Paragraph(cover.get('subtitle', ''), subtitle_style))
            
            story.append(Spacer(1, 2*cm))
            
            cover_info = []
            if cover.get('client'):
                cover_info.append(['Client:', cover.get('client', '')])
            if cover.get('company'):
                cover_info.append(['Entreprise:', cover.get('company', '')])
            if cover.get('date'):
                cover_info.append(['Date:', cover.get('date', '')])
            
            if cover_info:
                cover_table = Table(cover_info, colWidths=[3*cm, 10*cm])
                cover_table.setStyle(TableStyle([
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 11),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ]))
                story.append(cover_table)
            
            story.append(PageBreak())
        
        # Context
        context = content.get('context', '')
        if context:
            story.append(Paragraph('Contexte', heading_style))
            story.append(Paragraph(context, body_style))
            story.append(PageBreak())
        
        # Introduction
        introduction = content.get('introduction', '')
        if introduction:
            story.append(Paragraph('Introduction', heading_style))
            story.append(Paragraph(introduction, body_style))
            story.append(PageBreak())
        
        # Mandate
        mandate = content.get('mandate', {})
        if mandate:
            story.append(Paragraph('Mandat', heading_style))
            
            if mandate.get('description'):
                story.append(Paragraph(mandate.get('description', ''), body_style))
            
            objectives = mandate.get('objectives', [])
            if objectives:
                story.append(Spacer(1, 0.3*cm))
                story.append(Paragraph('Objectifs:', ParagraphStyle(
                    'ObjectiveTitle',
                    parent=body_style,
                    fontName='Helvetica-Bold',
                )))
                
                for obj in objectives:
                    if obj:
                        story.append(Paragraph(f"• {obj}", body_style))
            
            story.append(PageBreak())
        
        # Process
        process_steps = content.get('process', [])
        if process_steps:
            story.append(Paragraph('Processus de réalisation', heading_style))
            
            for idx, step in enumerate(process_steps, 1):
                step_title = step.get('title', f'Étape {idx}')
                step_desc = step.get('description', '')
                step_duration = step.get('duration', '')
                
                step_heading = Paragraph(
                    f"{idx}. {step_title}",
                    ParagraphStyle(
                        'StepHeading',
                        parent=body_style,
                        fontName='Helvetica-Bold',
                        fontSize=12,
                    )
                )
                story.append(step_heading)
                
                if step_desc:
                    story.append(Paragraph(step_desc, body_style))
                
                if step_duration:
                    story.append(Paragraph(
                        f"<i>Durée estimée: {step_duration}</i>",
                        ParagraphStyle(
                            'Duration',
                            parent=body_style,
                            fontSize=10,
                            textColor=colors.HexColor('#666666'),
                        )
                    ))
                
                story.append(Spacer(1, 0.5*cm))
            
            story.append(PageBreak())
        
        # Budget
        budget = content.get('budget', {})
        if budget:
            story.append(Paragraph('Budget détaillé', heading_style))
            
            budget_items = budget.get('items', [])
            if budget_items:
                # Table header
                table_data = [['Description', 'Quantité', 'Prix unitaire', 'Total']]
                
                for item in budget_items:
                    table_data.append([
                        item.get('description', ''),
                        str(item.get('quantity', 0)),
                        f"{item.get('unitPrice', 0):.2f}",
                        f"{item.get('total', 0):.2f}",
                    ])
                
                # Total row
                currency = budget.get('currency', 'EUR')
                total = budget.get('total', 0)
                table_data.append([
                    '',
                    '',
                    '<b>Total:</b>',
                    f"<b>{total:.2f} {currency}</b>",
                ])
                
                budget_table = Table(
                    table_data,
                    colWidths=[8*cm, 2*cm, 3*cm, 3*cm]
                )
                budget_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#000000')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 11),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -2), colors.HexColor('#ffffff')),
                    ('TEXTCOLOR', (0, 1), (-1, -2), colors.HexColor('#000000')),
                    ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -2), 10),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.HexColor('#ffffff'), colors.HexColor('#f9f9f9')]),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, -1), (-1, -1), 11),
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0f0f0')),
                ]))
                
                story.append(budget_table)
            
            story.append(PageBreak())
        
        # Team
        team_members = content.get('team', [])
        if team_members:
            story.append(Paragraph('Équipe de projet', heading_style))
            
            for member in team_members:
                member_name = member.get('name', '')
                member_role = member.get('role', '')
                member_bio = member.get('bio', '')
                
                if member_name:
                    story.append(Paragraph(
                        member_name,
                        ParagraphStyle(
                            'MemberName',
                            parent=body_style,
                            fontName='Helvetica-Bold',
                            fontSize=12,
                        )
                    ))
                
                if member_role:
                    story.append(Paragraph(
                        f"<i>{member_role}</i>",
                        ParagraphStyle(
                            'MemberRole',
                            parent=body_style,
                            fontSize=10,
                            textColor=colors.HexColor('#666666'),
                        )
                    ))
                
                if member_bio:
                    story.append(Paragraph(member_bio, body_style))
                
                story.append(Spacer(1, 0.5*cm))
            
            story.append(PageBreak())
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return buffer
