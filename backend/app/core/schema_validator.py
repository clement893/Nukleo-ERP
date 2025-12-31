"""
Database Schema Validator
Validates database schema compatibility at startup and provides runtime checks
"""

from typing import Dict, List, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, inspect
from app.core.logging import logger
from app.core.database import AsyncSessionLocal


class SchemaValidator:
    """Validates database schema compatibility with application models"""
    
    # Define expected columns for each table
    # Format: {table_name: {column_name: {'nullable': bool, 'type': str}}}
    EXPECTED_SCHEMA: Dict[str, Dict[str, Dict[str, any]]] = {
        'projects': {
            'id': {'nullable': False, 'type': 'integer'},
            'name': {'nullable': False, 'type': 'character varying'},
            'description': {'nullable': True, 'type': 'text'},
            'status': {'nullable': False, 'type': 'USER-DEFINED'},  # Enum
            'user_id': {'nullable': False, 'type': 'integer'},
            'client_id': {'nullable': True, 'type': 'integer'},
            'responsable_id': {'nullable': True, 'type': 'integer'},
            'created_at': {'nullable': False, 'type': 'timestamp with time zone'},
            'updated_at': {'nullable': False, 'type': 'timestamp with time zone'},
            # Optional columns (may not exist in older databases)
            'equipe': {'nullable': True, 'type': 'character varying', 'optional': True},
            'etape': {'nullable': True, 'type': 'character varying', 'optional': True},
            'order': {'nullable': True, 'type': 'integer', 'optional': True},
        },
        'project_tasks': {
            'id': {'nullable': False, 'type': 'integer'},
            'title': {'nullable': False, 'type': 'character varying'},
            'description': {'nullable': True, 'type': 'text'},
            'status': {'nullable': False, 'type': 'USER-DEFINED'},  # Enum
            'priority': {'nullable': False, 'type': 'USER-DEFINED'},  # Enum
            'team_id': {'nullable': False, 'type': 'integer'},
            'project_id': {'nullable': True, 'type': 'integer'},
            'assignee_id': {'nullable': True, 'type': 'integer'},
            'created_by_id': {'nullable': True, 'type': 'integer', 'optional': True},
            'due_date': {'nullable': True, 'type': 'timestamp with time zone'},
            'started_at': {'nullable': True, 'type': 'timestamp with time zone'},
            'completed_at': {'nullable': True, 'type': 'timestamp with time zone'},
            'order': {'nullable': False, 'type': 'integer', 'optional': True},
            'estimated_hours': {'nullable': True, 'type': 'numeric', 'optional': True},
            'created_at': {'nullable': False, 'type': 'timestamp with time zone'},
            'updated_at': {'nullable': False, 'type': 'timestamp with time zone'},
        },
        'employees': {
            'id': {'nullable': False, 'type': 'integer'},
            'first_name': {'nullable': False, 'type': 'character varying'},
            'last_name': {'nullable': False, 'type': 'character varying'},
            'email': {'nullable': True, 'type': 'character varying'},
            'created_at': {'nullable': False, 'type': 'timestamp with time zone'},
            'updated_at': {'nullable': False, 'type': 'timestamp with time zone'},
            # Optional columns
            'user_id': {'nullable': True, 'type': 'integer', 'optional': True},
            'team_id': {'nullable': True, 'type': 'integer', 'optional': True},
            'capacity_hours_per_week': {'nullable': True, 'type': 'numeric', 'optional': True},
        },
        'companies': {
            'id': {'nullable': False, 'type': 'integer'},
            'name': {'nullable': False, 'type': 'character varying'},
            'logo_url': {'nullable': True, 'type': 'character varying'},
            'created_at': {'nullable': False, 'type': 'timestamp with time zone'},
            'updated_at': {'nullable': False, 'type': 'timestamp with time zone'},
        },
    }
    
    @staticmethod
    async def check_table_columns(
        session: AsyncSession,
        table_name: str,
        expected_columns: Dict[str, Dict[str, any]]
    ) -> Dict[str, any]:
        """
        Check if table has expected columns
        
        Returns:
            {
                'exists': bool,
                'missing_required': List[str],
                'missing_optional': List[str],
                'extra': List[str],
                'status': 'ok' | 'missing_required' | 'missing_optional' | 'error'
            }
        """
        try:
            # Check if table exists
            result = await session.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = :table_name
                )
            """), {"table_name": table_name})
            
            table_exists = result.scalar()
            if not table_exists:
                return {
                    'exists': False,
                    'missing_required': list(expected_columns.keys()),
                    'missing_optional': [],
                    'extra': [],
                    'status': 'error',
                    'error': f"Table '{table_name}' does not exist"
                }
            
            # Get actual columns
            result = await session.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = :table_name
                ORDER BY ordinal_position
            """), {"table_name": table_name})
            
            actual_columns = {
                row[0]: {
                    'type': row[1],
                    'nullable': row[2] == 'YES'
                }
                for row in result
            }
            
            # Check for missing columns
            missing_required = []
            missing_optional = []
            
            for col_name, col_spec in expected_columns.items():
                if col_name not in actual_columns:
                    if col_spec.get('optional', False):
                        missing_optional.append(col_name)
                    else:
                        missing_required.append(col_name)
            
            # Check for extra columns (informational only)
            expected_col_names = set(expected_columns.keys())
            extra = [col for col in actual_columns.keys() if col not in expected_col_names]
            
            # Determine status
            if missing_required:
                status = 'missing_required'
            elif missing_optional:
                status = 'missing_optional'
            else:
                status = 'ok'
            
            return {
                'exists': True,
                'missing_required': missing_required,
                'missing_optional': missing_optional,
                'extra': extra,
                'status': status,
                'actual_columns': list(actual_columns.keys())
            }
        except Exception as e:
            logger.error(f"Error checking table {table_name}: {e}", exc_info=True)
            return {
                'exists': False,
                'missing_required': [],
                'missing_optional': [],
                'extra': [],
                'status': 'error',
                'error': str(e)
            }
    
    @staticmethod
    async def validate_schema() -> Dict[str, any]:
        """
        Validate entire database schema
        
        Returns:
            {
                'valid': bool,
                'tables': Dict[str, Dict],
                'issues': List[str],
                'warnings': List[str]
            }
        """
        issues = []
        warnings = []
        table_results = {}
        
        async with AsyncSessionLocal() as session:
            for table_name, expected_columns in SchemaValidator.EXPECTED_SCHEMA.items():
                result = await SchemaValidator.check_table_columns(
                    session, table_name, expected_columns
                )
                table_results[table_name] = result
                
                if result['status'] == 'error':
                    issues.append(f"Table '{table_name}': {result.get('error', 'Unknown error')}")
                elif result['status'] == 'missing_required':
                    issues.append(
                        f"Table '{table_name}' missing required columns: {', '.join(result['missing_required'])}"
                    )
                elif result['status'] == 'missing_optional':
                    warnings.append(
                        f"Table '{table_name}' missing optional columns: {', '.join(result['missing_optional'])}"
                    )
        
        return {
            'valid': len(issues) == 0,
            'tables': table_results,
            'issues': issues,
            'warnings': warnings
        }
    
    @staticmethod
    async def check_column_exists(
        session: AsyncSession,
        table_name: str,
        column_name: str
    ) -> bool:
        """Quick check if a specific column exists"""
        try:
            result = await session.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = :table_name
                    AND column_name = :column_name
                )
            """), {
                "table_name": table_name,
                "column_name": column_name
            })
            return result.scalar() or False
        except Exception:
            return False


async def validate_database_schema_on_startup() -> bool:
    """
    Validate database schema at application startup
    
    Returns:
        True if schema is valid, False otherwise
    """
    try:
        logger.info("Validating database schema compatibility...")
        validation_result = await SchemaValidator.validate_schema()
        
        if not validation_result['valid']:
            logger.error(
                "Database schema validation failed!",
                context={
                    "issues": validation_result['issues'],
                    "warnings": validation_result['warnings']
                }
            )
            logger.error(
                "CRITICAL: Database schema is not compatible with application code. "
                "Please run migrations: alembic upgrade head"
            )
            # Don't block startup, but log the error
            return False
        
        if validation_result['warnings']:
            logger.warning(
                "Database schema has optional columns missing (non-critical)",
                context={"warnings": validation_result['warnings']}
            )
        else:
            logger.info("Database schema validation passed")
        
        return True
    except Exception as e:
        logger.error(f"Error during schema validation: {e}", exc_info=True)
        # Don't block startup on validation errors
        return False
