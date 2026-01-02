"""
Script to update employees with their employee numbers and assign them to teams
"""
import asyncio
import sys
import os

# Add parent directory (backend) and root directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
sys.path.insert(0, backend_dir)
sys.path.insert(0, root_dir)

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from app.core.logging import logger

# Import the correct Team model (from projets module)
from templates.modules.projets.models.team import Team as ProjectTeam
from templates.modules.employes.models.employe import Employee

# Employee data: Numéro, Nom, Équipe
EMPLOYEE_DATA = [
    {"number": "1", "name": "Alexei Bissonnette", "team": "Le Lab"},
    {"number": "4", "name": "Antoine Doray", "team": "Gestion"},
    {"number": "6", "name": "Margaux Goethals", "team": "Le Studio"},
    {"number": "11", "name": "Sarah Katerji", "team": "Le Lab"},
    {"number": "12", "name": "Meriem Kouidri", "team": "Le Bureau"},
    {"number": "13", "name": "Clément Roy", "team": "Le Bureau"},
    {"number": "16", "name": "Margot Montmartin", "team": "Le Studio"},
    {"number": "18", "name": "Omar Hamdi", "team": "Le Bureau"},
    {"number": "19", "name": "Guillaume Pigeon", "team": "Le Lab"},
    {"number": "20", "name": "Julien Tavernier", "team": "Le Lab"},
    {"number": "21", "name": "Camille Gauthier", "team": "Le Studio"},
    {"number": "22", "name": "Marie-Claire Lajeunesse", "team": "Le Studio"},
    {"number": "23", "name": "Ricardo José Aranha Wierzynski", "team": "Le Lab"},
    {"number": "24", "name": "Hind Djebien", "team": "Le Lab"},
    {"number": "25", "name": "Maxime Besnier", "team": "Le Bureau"},
    {"number": "26", "name": "Séverine Di Mambro", "team": "Gestion"},
    {"number": "27", "name": "Jean-François Lemieux", "team": "Le Lab"},
    {"number": "28", "name": "Nathan Thoelen", "team": "Le Bureau"},
    {"number": "F1", "name": "Timothé Lacoste", "team": "Le Lab / Fournisseur"},
]


async def get_or_create_team(db: AsyncSession, team_name: str) -> ProjectTeam:
    """Get or create a team by name"""
    # Normalize team name - handle "Le Lab / Fournisseur" case
    if "/" in team_name:
        # For "Le Lab / Fournisseur", use "Le Lab" as primary team
        team_name = team_name.split("/")[0].strip()
    
    # Try to find existing team
    result = await db.execute(
        select(ProjectTeam).where(ProjectTeam.name == team_name)
    )
    team = result.scalar_one_or_none()
    
    if team:
        logger.info(f"Found existing team: {team_name} (ID: {team.id})")
        return team
    
    # Create new team
    team = ProjectTeam(
        name=team_name,
        description=f"Équipe {team_name}",
    )
    db.add(team)
    await db.flush()
    logger.info(f"Created new team: {team_name} (ID: {team.id})")
    return team


async def find_employee_by_name(db: AsyncSession, full_name: str) -> Employee | None:
    """Find employee by full name (first_name + last_name)"""
    # Split name into first and last
    parts = full_name.strip().split(" ", 1)
    if len(parts) == 1:
        first_name = parts[0]
        last_name = ""
    else:
        first_name = parts[0]
        last_name = parts[1]
    
    # Try exact match first
    result = await db.execute(
        select(Employee).where(
            Employee.first_name == first_name,
            Employee.last_name == last_name
        )
    )
    employee = result.scalar_one_or_none()
    
    if employee:
        return employee
    
    # Try case-insensitive match
    from sqlalchemy import func
    result = await db.execute(
        select(Employee).where(
            func.lower(Employee.first_name) == first_name.lower(),
            func.lower(Employee.last_name) == last_name.lower()
        )
    )
    employee = result.scalar_one_or_none()
    
    if employee:
        return employee
    
    # Try partial match (first name only)
    result = await db.execute(
        select(Employee).where(
            func.lower(Employee.first_name) == first_name.lower()
        )
    )
    employees = result.scalars().all()
    
    if len(employees) == 1:
        return employees[0]
    
    return None


async def update_employees():
    """Update employees with their numbers and teams"""
    async with AsyncSessionLocal() as db:
        try:
            # Get unique team names
            team_names = set()
            for emp_data in EMPLOYEE_DATA:
                team_name = emp_data["team"]
                if "/" in team_name:
                    # Handle "Le Lab / Fournisseur" - use "Le Lab"
                    team_name = team_name.split("/")[0].strip()
                team_names.add(team_name)
            
            # Create or get all teams
            teams_map = {}
            for team_name in team_names:
                team = await get_or_create_team(db, team_name)
                teams_map[team_name] = team
            
            # Also handle "Fournisseur" separately if needed
            if "Fournisseur" not in teams_map:
                fournisseur_team = await get_or_create_team(db, "Fournisseur")
                teams_map["Fournisseur"] = fournisseur_team
            
            updated_count = 0
            not_found = []
            
            # Update each employee
            for emp_data in EMPLOYEE_DATA:
                employee = await find_employee_by_name(db, emp_data["name"])
                
                if not employee:
                    logger.warning(f"Employee not found: {emp_data['name']}")
                    not_found.append(emp_data["name"])
                    continue
                
                # Determine team
                team_name = emp_data["team"]
                if "/" in team_name:
                    # For "Le Lab / Fournisseur", use "Le Lab"
                    team_name = team_name.split("/")[0].strip()
                
                team = teams_map.get(team_name)
                if not team:
                    logger.warning(f"Team not found: {team_name}")
                    continue
                
                # Update employee
                employee.employee_number = emp_data["number"]
                employee.team_id = team.id
                
                updated_count += 1
                logger.info(
                    f"Updated {emp_data['name']}: "
                    f"number={emp_data['number']}, team={team_name}"
                )
            
            await db.commit()
            
            logger.info(f"\n✅ Successfully updated {updated_count} employees")
            if not_found:
                logger.warning(f"\n⚠️  Employees not found: {', '.join(not_found)}")
            
            # List all teams
            result = await db.execute(select(ProjectTeam))
            all_teams = result.scalars().all()
            logger.info(f"\n📋 All teams in database:")
            for team in all_teams:
                logger.info(f"  - {team.name} (ID: {team.id})")
            
        except Exception as e:
            logger.error(f"Error updating employees: {e}", exc_info=True)
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(update_employees())
