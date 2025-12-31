"""add project extended fields

Revision ID: 054_add_project_extended_fields
Revises: 053_ensure_client_id_in_projects
Create Date: 2024-12-31 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '054_add_project_extended_fields'
down_revision = '053_ensure_client_id_in_projects'
branch_labels = None
depends_on = None


def upgrade():
    """Add extended fields to projects table"""
    
    # Add information fields
    op.add_column('projects', sa.Column('equipe', sa.String(50), nullable=True))
    op.add_column('projects', sa.Column('etape', sa.String(100), nullable=True))
    op.add_column('projects', sa.Column('annee_realisation', sa.String(50), nullable=True))
    
    # Add contact field
    op.add_column('projects', sa.Column('contact', sa.String(255), nullable=True))
    
    # Add financial fields
    op.add_column('projects', sa.Column('taux_horaire', sa.Numeric(10, 2), nullable=True))
    op.add_column('projects', sa.Column('budget', sa.Numeric(15, 2), nullable=True))
    
    # Add link fields
    op.add_column('projects', sa.Column('proposal_url', sa.String(500), nullable=True))
    op.add_column('projects', sa.Column('drive_url', sa.String(500), nullable=True))
    op.add_column('projects', sa.Column('slack_url', sa.String(500), nullable=True))
    op.add_column('projects', sa.Column('echeancier_url', sa.String(500), nullable=True))
    
    # Add deliverable status fields
    op.add_column('projects', sa.Column('temoignage_status', sa.String(50), nullable=True))
    op.add_column('projects', sa.Column('portfolio_status', sa.String(50), nullable=True))
    
    # Add indexes for commonly filtered fields
    op.create_index('idx_projects_etape', 'projects', ['etape'])
    op.create_index('idx_projects_annee_realisation', 'projects', ['annee_realisation'])


def downgrade():
    """Remove extended fields from projects table"""
    
    # Drop indexes
    op.drop_index('idx_projects_annee_realisation', table_name='projects')
    op.drop_index('idx_projects_etape', table_name='projects')
    
    # Drop columns
    op.drop_column('projects', 'portfolio_status')
    op.drop_column('projects', 'temoignage_status')
    op.drop_column('projects', 'echeancier_url')
    op.drop_column('projects', 'slack_url')
    op.drop_column('projects', 'drive_url')
    op.drop_column('projects', 'proposal_url')
    op.drop_column('projects', 'budget')
    op.drop_column('projects', 'taux_horaire')
    op.drop_column('projects', 'contact')
    op.drop_column('projects', 'annee_realisation')
    op.drop_column('projects', 'etape')
    op.drop_column('projects', 'equipe')
