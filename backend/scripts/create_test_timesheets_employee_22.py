#!/usr/bin/env python3
"""
Script to create test time entries for employee 22 (Sarah Katerji)
Creates sample time entries with various tasks, projects, and clients
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.models.employee import Employee
from app.models.time_entry import TimeEntry
from app.models.project_task import ProjectTask
from app.models.project import Project
from app.models.client import Client


async def create_test_timesheets(db: AsyncSession, employee_id: int = 22):
    """Create test time entries for employee 22"""
    print(f"📝 Création de feuilles de temps de test pour l'employé {employee_id}...")
    
    # Get employee
    result = await db.execute(
        select(Employee).where(Employee.id == employee_id)
    )
    employee = result.scalar_one_or_none()
    
    if not employee:
        print(f"❌ Employé {employee_id} non trouvé")
        return
    
    if not employee.user_id:
        print(f"❌ L'employé {employee_id} n'a pas de user_id associé")
        return
    
    print(f"✅ Employé trouvé: {employee.first_name} {employee.last_name} (user_id: {employee.user_id})")
    
    # Get or create some projects
    result = await db.execute(select(Project).limit(5))
    projects = result.scalars().all()
    
    if not projects:
        print("⚠️  Aucun projet trouvé. Création de projets de test...")
        # Create a default project if none exist
        default_project = Project(
            name="Projet de développement",
            description="Projet de test pour les feuilles de temps",
            team_id=employee.team_id if hasattr(employee, 'team_id') else None,
        )
        db.add(default_project)
        await db.flush()
        projects = [default_project]
    
    # Get or create some clients
    result = await db.execute(select(Client).limit(5))
    clients = result.scalars().all()
    
    if not clients:
        print("⚠️  Aucun client trouvé. Création d'un client de test...")
        default_client = Client(
            company_name="Client Test",
            email="client@test.com",
        )
        db.add(default_client)
        await db.flush()
        clients = [default_client]
    
    # Get or create some tasks
    result = await db.execute(
        select(ProjectTask)
        .where(ProjectTask.assignee_id == employee.user_id)
        .limit(10)
    )
    tasks = result.scalars().all()
    
    if not tasks:
        print("⚠️  Aucune tâche trouvée. Création de tâches de test...")
        # Create some default tasks
        task_titles = [
            "Développement fonctionnalité X",
            "Révision code",
            "Tests unitaires",
            "Documentation",
            "Réunion client",
        ]
        
        for i, title in enumerate(task_titles):
            task = ProjectTask(
                title=title,
                description=f"Tâche de test pour {employee.first_name}",
                status="in_progress",
                priority="medium",
                team_id=employee.team_id if hasattr(employee, 'team_id') else None,
                project_id=projects[0].id if projects else None,
                assignee_id=employee.user_id,
                order=i,
            )
            db.add(task)
        
        await db.flush()
        
        # Reload tasks
        result = await db.execute(
            select(ProjectTask)
            .where(ProjectTask.assignee_id == employee.user_id)
        )
        tasks = result.scalars().all()
    
    print(f"✅ {len(projects)} projet(s), {len(clients)} client(s), {len(tasks)} tâche(s) disponibles")
    
    # Create time entries for the last 2 weeks
    today = datetime.now()
    entries_created = 0
    
    # Sample descriptions
    descriptions = [
        "Développement de la fonctionnalité principale",
        "Correction de bugs",
        "Réunion avec l'équipe",
        "Tests et validation",
        "Documentation technique",
        "Code review",
        "Optimisation des performances",
        "Intégration API",
    ]
    
    for day_offset in range(14):  # Last 2 weeks
        date = today - timedelta(days=day_offset)
        
        # Skip weekends (optional - comment out if you want weekends too)
        if date.weekday() >= 5:  # Saturday = 5, Sunday = 6
            continue
        
        # Create 1-3 entries per day
        num_entries = random.randint(1, 3)
        
        for entry_num in range(num_entries):
            # Random task, project, client
            task = random.choice(tasks) if tasks else None
            project = random.choice(projects) if projects else None
            client = random.choice(clients) if clients else None
            
            # Random duration between 30 minutes and 4 hours (in seconds)
            duration_seconds = random.randint(1800, 14400)  # 30 min to 4 hours
            
            # Random time during the day
            hour = random.randint(9, 17)
            minute = random.choice([0, 15, 30, 45])
            entry_date = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            time_entry = TimeEntry(
                user_id=employee.user_id,
                task_id=task.id if task else None,
                project_id=project.id if project else None,
                client_id=client.id if client else None,
                description=random.choice(descriptions),
                duration=duration_seconds,
                date=entry_date,
            )
            
            db.add(time_entry)
            entries_created += 1
    
    await db.commit()
    
    print(f"✅ {entries_created} entrées de temps créées avec succès pour {employee.first_name} {employee.last_name}")
    print(f"   Période: {today - timedelta(days=13)} à {today}")
    
    # Calculate total hours
    result = await db.execute(
        select(TimeEntry)
        .where(TimeEntry.user_id == employee.user_id)
    )
    all_entries = result.scalars().all()
    total_seconds = sum(entry.duration for entry in all_entries)
    total_hours = total_seconds / 3600
    
    print(f"   Total heures: {total_hours:.2f}h ({len(all_entries)} entrées)")


async def main():
    """Main function"""
    print("🚀 Création de feuilles de temps de test pour l'employé 22...")
    
    # Create database engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
    )
    
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        try:
            await create_test_timesheets(session, employee_id=22)
        except Exception as e:
            print(f"❌ Erreur: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
