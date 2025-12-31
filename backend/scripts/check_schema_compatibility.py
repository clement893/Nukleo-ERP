#!/usr/bin/env python3
"""
Schema Compatibility Checker
Standalone script to check database schema compatibility

Usage:
    python scripts/check_schema_compatibility.py
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.schema_validator import SchemaValidator
from app.core.database import AsyncSessionLocal
from app.core.logging import logger


async def main():
    """Main function to check schema compatibility"""
    print("=" * 80)
    print("DATABASE SCHEMA COMPATIBILITY CHECK")
    print("=" * 80)
    print()
    
    try:
        validation_result = await SchemaValidator.validate_schema()
        
        print("VALIDATION RESULTS")
        print("-" * 80)
        
        if validation_result['valid']:
            print("✅ Schema is VALID - All required columns exist")
        else:
            print("❌ Schema is INVALID - Missing required columns")
        
        print()
        
        # Show table details
        print("TABLE DETAILS")
        print("-" * 80)
        for table_name, table_result in validation_result['tables'].items():
            status_icon = "✅" if table_result['status'] == 'ok' else "❌" if table_result['status'] == 'missing_required' else "⚠️"
            print(f"{status_icon} {table_name}")
            
            if not table_result.get('exists', False):
                print(f"   ❌ Table does not exist")
            else:
                if table_result.get('missing_required'):
                    print(f"   ❌ Missing required columns: {', '.join(table_result['missing_required'])}")
                if table_result.get('missing_optional'):
                    print(f"   ⚠️  Missing optional columns: {', '.join(table_result['missing_optional'])}")
                if table_result.get('status') == 'ok':
                    print(f"   ✅ All columns present ({len(table_result.get('actual_columns', []))} columns)")
        
        print()
        
        # Show issues
        if validation_result['issues']:
            print("CRITICAL ISSUES")
            print("-" * 80)
            for issue in validation_result['issues']:
                print(f"❌ {issue}")
            print()
            print("RECOMMENDED ACTION:")
            print("   Run: alembic upgrade head")
            print()
        
        # Show warnings
        if validation_result['warnings']:
            print("WARNINGS (Non-critical)")
            print("-" * 80)
            for warning in validation_result['warnings']:
                print(f"⚠️  {warning}")
            print()
        
        # Summary
        print("=" * 80)
        if validation_result['valid']:
            print("✅ SCHEMA COMPATIBILITY: OK")
            print("   Database schema is compatible with application code")
            return 0
        else:
            print("❌ SCHEMA COMPATIBILITY: FAILED")
            print(f"   Found {len(validation_result['issues'])} critical issue(s)")
            print("   Please run migrations: alembic upgrade head")
            return 1
        
    except Exception as e:
        print(f"❌ Error during schema validation: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
