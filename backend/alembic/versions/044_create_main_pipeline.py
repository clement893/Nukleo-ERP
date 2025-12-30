"""create main pipeline

Revision ID: 044_create_main_pipeline
Revises: 043_create_clients_table
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '044_create_main_pipeline'
down_revision = '043_create_clients_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create MAIN pipeline with all stages"""
    # Vérifier si le pipeline MAIN existe déjà
    connection = op.get_bind()
    
    result = connection.execute(sa.text("SELECT id FROM pipelines WHERE name = 'MAIN'"))
    existing = result.fetchone()
    
    if existing:
        # Pipeline existe déjà, ne rien faire
        return
    
    # Récupérer le premier utilisateur comme créateur
    result = connection.execute(sa.text("SELECT id FROM users LIMIT 1"))
    first_user = result.fetchone()
    
    if not first_user:
        # Pas d'utilisateur, créer le pipeline sans created_by_id
        pipeline_id = connection.execute(sa.text("SELECT gen_random_uuid()")).scalar()
        connection.execute(sa.text("""
            INSERT INTO pipelines (id, name, description, is_default, is_active, created_at, updated_at)
            VALUES (:id, 'MAIN', 'Pipeline principal pour la gestion des opportunités commerciales', true, true, NOW(), NOW())
        """), {"id": pipeline_id})
    else:
        pipeline_id = connection.execute(sa.text("SELECT gen_random_uuid()")).scalar()
        connection.execute(sa.text("""
            INSERT INTO pipelines (id, name, description, is_default, is_active, created_by_id, created_at, updated_at)
            VALUES (:id, 'MAIN', 'Pipeline principal pour la gestion des opportunités commerciales', true, true, :user_id, NOW(), NOW())
        """), {"id": pipeline_id, "user_id": first_user[0]})
    
    # Créer toutes les étapes
    stages = [
        ('00 - Idées de projet', 0, '#94A3B8'),
        ('00 - Idées de contact', 1, '#94A3B8'),
        ('01 - Suivi /Emails', 2, '#3B82F6'),
        ('02 - Leads', 3, '#3B82F6'),
        ('03 - Rencontre booké', 4, '#8B5CF6'),
        ('04 - En discussion', 5, '#8B5CF6'),
        ('05 - Proposal to do', 6, '#F59E0B'),
        ('06 - Proposal sent', 7, '#F59E0B'),
        ('07 - Contract to do', 8, '#EF4444'),
        ('08 - Contract sent', 9, '#EF4444'),
        ('09 - Closed Won', 10, '#10B981'),
        ('Closed Lost', 11, '#6B7280'),
        ('En attente ou Silence radio', 12, '#FBBF24'),
        ('Renouvellement à venir', 13, '#10B981'),
        ('Renouvellements potentiels', 14, '#10B981'),
    ]
    
    for name, order, color in stages:
        stage_id = connection.execute(sa.text("SELECT gen_random_uuid()")).scalar()
        connection.execute(sa.text("""
            INSERT INTO pipeline_stages (id, pipeline_id, name, description, color, "order", created_at, updated_at)
            VALUES (:id, :pipeline_id, :name, :description, :color, :order, NOW(), NOW())
        """), {
            "id": stage_id,
            "pipeline_id": pipeline_id,
            "name": name,
            "description": f"Étape: {name}",
            "color": color,
            "order": order
        })


def downgrade() -> None:
    """Remove MAIN pipeline and its stages"""
    connection = op.get_bind()
    
    # Supprimer les étapes du pipeline MAIN
    connection.execute(sa.text("""
        DELETE FROM pipeline_stages 
        WHERE pipeline_id IN (SELECT id FROM pipelines WHERE name = 'MAIN')
    """))
    
    # Supprimer le pipeline MAIN
    connection.execute(sa.text("DELETE FROM pipelines WHERE name = 'MAIN'"))
