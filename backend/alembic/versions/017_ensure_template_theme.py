"""Ensure TemplateTheme exists

Revision ID: 017_ensure_template_theme
Revises: 016
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '017_ensure_template_theme'
down_revision = '016_remove_default_theme'
branch_labels = None
depends_on = None


def upgrade():
    """Ensure TemplateTheme (ID 32) exists in the database."""
    conn = op.get_bind()
    trans = conn.begin()
    
    try:
        # Check if themes table exists
        inspector = sa.inspect(conn)
        tables = inspector.get_table_names()
        
        if 'themes' not in tables:
            print("⚠️  Themes table does not exist, skipping TemplateTheme creation")
            print("   Run migration 001_create_themes_table first")
            trans.rollback()
            return
        
        # Check if TemplateTheme (ID 32) already exists
        result = conn.execute(text("SELECT id, is_active FROM themes WHERE id = 32"))
        existing_theme = result.fetchone()
        
        if existing_theme:
            print("✅ TemplateTheme (ID 32) already exists")
            
            # Ensure it's active if no other theme is active
            active_result = conn.execute(text("SELECT id FROM themes WHERE is_active = true AND id != 32"))
            active_theme = active_result.fetchone()
            
            if not active_theme and not existing_theme[1]:  # existing_theme[1] is is_active
                print("   Activating TemplateTheme (no other active theme found)")
                conn.execute(text("UPDATE themes SET is_active = true, updated_at = NOW() WHERE id = 32"))
            
            trans.commit()
            return
        
        # Check if any theme is currently active
        active_result = conn.execute(text("SELECT id FROM themes WHERE is_active = true"))
        active_theme = active_result.fetchone()
        
        # Create TemplateTheme - activate it only if no other theme is active
        is_active = active_theme is None
        
        # Default config for TemplateTheme
        default_config = {
            "mode": "system",
            "primary": "#3b82f6",
            "secondary": "#8b5cf6",
            "danger": "#ef4444",
            "warning": "#f59e0b",
            "info": "#06b6d4",
            "font_family": "Inter",
            "border_radius": "8px",
        }
        
        import json
        config_json = json.dumps(default_config)
        
        # Insert TemplateTheme with ID 32
        conn.execute(text("""
            INSERT INTO themes (id, name, display_name, description, config, is_active, created_by, created_at, updated_at)
            VALUES (32, 'TemplateTheme', 'Template Theme', 'Master theme that controls all components', 
                    :config::jsonb, :is_active, 1, NOW(), NOW())
        """), {
            "config": config_json,
            "is_active": is_active
        })
        
        trans.commit()
        print(f"✅ Created TemplateTheme (ID 32) - Active: {is_active}")
        
    except Exception as e:
        trans.rollback()
        print(f"❌ Error creating TemplateTheme: {e}")
        raise


def downgrade():
    """Remove TemplateTheme (ID 32) if it exists."""
    conn = op.get_bind()
    
    # Check if themes table exists
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'themes' not in tables:
        print("⚠️  Themes table does not exist, skipping TemplateTheme removal")
        return
    
    # Check if TemplateTheme exists
    result = conn.execute(text("SELECT id FROM themes WHERE id = 32"))
    existing_theme = result.fetchone()
    
    if existing_theme:
        # Check if it's the only theme
        all_themes_result = conn.execute(text("SELECT COUNT(*) FROM themes"))
        theme_count = all_themes_result.scalar()
        
        if theme_count == 1:
            print("⚠️  TemplateTheme is the only theme, skipping removal")
            print("   Create another theme before removing TemplateTheme")
            return
        
        # If it's active, activate another theme first
        if existing_theme:
            active_check = conn.execute(text("SELECT is_active FROM themes WHERE id = 32"))
            is_active = active_check.scalar()
            
            if is_active:
                # Find another theme to activate
                other_theme_result = conn.execute(text("SELECT id FROM themes WHERE id != 32 LIMIT 1"))
                other_theme = other_theme_result.fetchone()
                
                if other_theme:
                    conn.execute(text("UPDATE themes SET is_active = true WHERE id = :id"), {"id": other_theme[0]})
                    print(f"   Activated theme ID {other_theme[0]} before removing TemplateTheme")
        
        # Remove TemplateTheme
        conn.execute(text("DELETE FROM themes WHERE id = 32"))
        conn.commit()
        print("✅ Removed TemplateTheme (ID 32)")
    else:
        print("ℹ️  TemplateTheme (ID 32) does not exist, nothing to remove")

