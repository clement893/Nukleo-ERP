"""
Seed script for teams and project tasks
Creates 3 teams (Bureau, Studio, Lab) with 1 employee each and sample tasks
"""

import asyncio
import sys
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, init_db
from app.models import User, Team, TeamMember, ProjectTask, TaskStatus, TaskPriority
from app.core.security import hash_password


async def seed_teams():
    """Seed database with teams, employees and tasks."""
    await init_db()

    async with AsyncSessionLocal() as session:
        try:
            # Vérifier si les équipes existent déjà
            result = await session.execute(select(Team).where(Team.slug.in_(['bureau', 'studio', 'lab'])))
            existing_teams = result.scalars().all()
            
            if existing_teams:
                print("Teams already seeded. Skipping...")
                return

            # Récupérer ou créer un utilisateur admin pour être propriétaire des équipes
            result = await session.execute(select(User).where(User.email == "admin@example.com"))
            admin_user = result.scalar_one_or_none()
            
            if not admin_user:
                # Créer un utilisateur admin si il n'existe pas
                admin_user = User(
                    email="admin@example.com",
                    hashed_password=hash_password("admin123"),
                    first_name="Admin",
                    last_name="User",
                    is_active=True,
                )
                session.add(admin_user)
                await session.flush()

            # Créer les 3 équipes
            teams_data = [
                {
                    'name': 'Bureau',
                    'slug': 'bureau',
                    'description': 'Équipe administrative et gestion',
                    'employee': {
                        'first_name': 'Jean',
                        'last_name': 'Dupont',
                        'email': 'jean.dupont@example.com',
                    },
                    'tasks': [
                        {'title': 'Révision du budget Q1', 'status': TaskStatus.IN_PROGRESS, 'priority': TaskPriority.HIGH},
                        {'title': 'Préparation réunion client', 'status': TaskStatus.TODO, 'priority': TaskPriority.MEDIUM},
                    ],
                },
                {
                    'name': 'Studio',
                    'slug': 'studio',
                    'description': 'Équipe créative et design',
                    'employee': {
                        'first_name': 'Marie',
                        'last_name': 'Martin',
                        'email': 'marie.martin@example.com',
                    },
                    'tasks': [
                        {'title': 'Design landing page', 'status': TaskStatus.IN_PROGRESS, 'priority': TaskPriority.HIGH},
                        {'title': 'Création logo', 'status': TaskStatus.BLOCKED, 'priority': TaskPriority.MEDIUM},
                    ],
                },
                {
                    'name': 'Lab',
                    'slug': 'lab',
                    'description': 'Équipe technique et développement',
                    'employee': {
                        'first_name': 'Pierre',
                        'last_name': 'Durand',
                        'email': 'pierre.durand@example.com',
                    },
                    'tasks': [
                        {'title': 'Tests API', 'status': TaskStatus.IN_PROGRESS, 'priority': TaskPriority.URGENT},
                        {'title': 'Documentation technique', 'status': TaskStatus.TODO, 'priority': TaskPriority.LOW},
                    ],
                },
            ]

            # Récupérer le rôle "member" par défaut (ou créer un rôle par défaut)
            from app.models import Role
            result = await session.execute(select(Role).where(Role.slug == "member"))
            member_role = result.scalar_one_or_none()
            
            if not member_role:
                # Créer un rôle member par défaut
                member_role = Role(
                    name="Member",
                    slug="member",
                    description="Team member role",
                )
                session.add(member_role)
                await session.flush()

            created_teams = []
            created_users = []

            for team_data in teams_data:
                # Créer l'équipe
                team = Team(
                    name=team_data['name'],
                    slug=team_data['slug'],
                    description=team_data['description'],
                    owner_id=admin_user.id,
                    is_active=True,
                )
                session.add(team)
                await session.flush()
                created_teams.append(team)

                # Créer l'employé (utilisateur)
                employee_data = team_data['employee']
                employee_user = User(
                    email=employee_data['email'],
                    hashed_password=hash_password("password123"),  # Mot de passe par défaut
                    first_name=employee_data['first_name'],
                    last_name=employee_data['last_name'],
                    is_active=True,
                )
                session.add(employee_user)
                await session.flush()
                created_users.append(employee_user)

                # Ajouter l'employé à l'équipe
                team_member = TeamMember(
                    team_id=team.id,
                    user_id=employee_user.id,
                    role_id=member_role.id,
                    is_active=True,
                )
                session.add(team_member)

                # Créer les tâches pour cet employé
                for task_data in team_data['tasks']:
                    task = ProjectTask(
                        title=task_data['title'],
                        description=f"Tâche pour l'équipe {team_data['name']}",
                        status=task_data['status'],
                        priority=task_data['priority'],
                        team_id=team.id,
                        assignee_id=employee_user.id,
                        created_by_id=admin_user.id,
                        order=0,
                    )
                    session.add(task)

            await session.commit()
            
            print(f"✓ Created {len(created_teams)} teams")
            print(f"✓ Created {len(created_users)} employees")
            print("✓ Created tasks for each team")
            print("\nTeams created:")
            for team in created_teams:
                print(f"  - {team.name} ({team.slug})")
            print("\nEmployees created:")
            for user in created_users:
                print(f"  - {user.first_name} {user.last_name} ({user.email})")
            print("\nDefault password for employees: password123")

        except Exception as e:
            await session.rollback()
            print(f"Error seeding teams: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed_teams())
