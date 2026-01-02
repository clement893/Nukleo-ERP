"""
Notification Templates
Pre-defined notification templates for common events
"""

from typing import Optional, Dict, Any
from app.models.notification import NotificationType


class NotificationTemplates:
    """Pre-defined notification templates"""
    
    @staticmethod
    def task_assigned(
        task_title: str, 
        project_name: Optional[str] = None,
        task_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for task assignment notification"""
        return {
            "title": "Nouvelle tâche assignée",
            "message": f"La tâche '{task_title}' vous a été assignée{f' dans le projet {project_name}' if project_name else ''}.",
            "type": NotificationType.INFO,
            "action_url": f"/dashboard/projects/tasks{f'?task={task_id}' if task_id else ''}",
            "action_label": "Voir la tâche",
            "metadata": {
                "event_type": "task_assigned",
                "task_id": task_id,
                "task_title": task_title
            }
        }
    
    @staticmethod
    def task_created(
        task_title: str,
        project_name: Optional[str] = None,
        task_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for task creation notification"""
        return {
            "title": "Tâche créée",
            "message": f"La tâche '{task_title}' a été créée{f' dans le projet {project_name}' if project_name else ''}.",
            "type": NotificationType.SUCCESS,
            "action_url": f"/dashboard/projects/tasks{f'?task={task_id}' if task_id else ''}",
            "action_label": "Voir la tâche",
            "metadata": {
                "event_type": "task_created",
                "task_id": task_id,
                "task_title": task_title
            }
        }
    
    @staticmethod
    def task_comment(
        task_title: str,
        commenter_name: str,
        task_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for task comment notification"""
        return {
            "title": "Nouveau commentaire",
            "message": f"{commenter_name} a commenté sur la tâche '{task_title}'.",
            "type": NotificationType.INFO,
            "action_url": f"/dashboard/projects/tasks{f'?task={task_id}' if task_id else ''}",
            "action_label": "Voir le commentaire",
            "metadata": {
                "event_type": "task_comment",
                "task_id": task_id,
                "task_title": task_title,
                "commenter_name": commenter_name
            }
        }
    
    @staticmethod
    def task_completed(
        task_title: str,
        completer_name: str,
        task_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for task completion notification"""
        return {
            "title": "Tâche complétée",
            "message": f"La tâche '{task_title}' a été complétée par {completer_name}.",
            "type": NotificationType.SUCCESS,
            "action_url": f"/dashboard/projects/tasks{f'?task={task_id}' if task_id else ''}",
            "action_label": "Voir la tâche",
            "metadata": {
                "event_type": "task_completed",
                "task_id": task_id,
                "task_title": task_title
            }
        }
    
    @staticmethod
    def task_due_soon(
        task_title: str,
        days_until_due: int,
        task_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for task due soon notification"""
        return {
            "title": "Échéance approchante",
            "message": f"La tâche '{task_title}' est due dans {days_until_due} jour{'s' if days_until_due > 1 else ''}.",
            "type": NotificationType.WARNING,
            "action_url": f"/dashboard/projects/tasks{f'?task={task_id}' if task_id else ''}",
            "action_label": "Voir la tâche",
            "metadata": {
                "event_type": "task_due_soon",
                "task_id": task_id,
                "task_title": task_title,
                "days_until_due": days_until_due
            }
        }
    
    @staticmethod
    def project_created(
        project_name: str,
        project_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for project creation notification"""
        return {
            "title": "Projet créé",
            "message": f"Le projet '{project_name}' a été créé avec succès.",
            "type": NotificationType.SUCCESS,
            "action_url": f"/dashboard/projects{f'?project={project_id}' if project_id else ''}",
            "action_label": "Voir le projet",
            "metadata": {
                "event_type": "project_created",
                "project_id": project_id,
                "project_name": project_name
            }
        }
    
    @staticmethod
    def project_member_added(
        project_name: str,
        project_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for project member addition notification"""
        return {
            "title": "Ajouté à un projet",
            "message": f"Vous avez été ajouté au projet '{project_name}'.",
            "type": NotificationType.INFO,
            "action_url": f"/dashboard/projects{f'?project={project_id}' if project_id else ''}",
            "action_label": "Voir le projet",
            "metadata": {
                "event_type": "project_member_added",
                "project_id": project_id,
                "project_name": project_name
            }
        }
    
    @staticmethod
    def team_member_added(
        team_name: str,
        team_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for team member addition notification"""
        return {
            "title": "Ajouté à une équipe",
            "message": f"Vous avez été ajouté à l'équipe '{team_name}'.",
            "type": NotificationType.INFO,
            "action_url": f"/dashboard/teams{f'?team={team_id}' if team_id else ''}",
            "action_label": "Voir l'équipe",
            "metadata": {
                "event_type": "team_member_added",
                "team_id": team_id,
                "team_name": team_name
            }
        }
    
    @staticmethod
    def treasury_low_balance(
        account_name: str,
        balance: float,
        account_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for low treasury balance notification"""
        return {
            "title": "Solde faible détecté",
            "message": f"Le compte '{account_name}' a un solde faible ({balance:,.2f} $).",
            "type": NotificationType.WARNING,
            "action_url": f"/dashboard/finances/tresorerie{f'?account={account_id}' if account_id else ''}",
            "action_label": "Voir la trésorerie",
            "metadata": {
                "event_type": "treasury_low_balance",
                "account_id": account_id,
                "account_name": account_name,
                "balance": balance
            }
        }
    
    @staticmethod
    def treasury_negative_cashflow(
        weeks_count: int
    ) -> Dict[str, Any]:
        """Template for negative cashflow notification"""
        return {
            "title": "Cashflow négatif",
            "message": f"{weeks_count} semaine{'s' if weeks_count > 1 else ''} sur les 4 dernières ont un cashflow négatif.",
            "type": NotificationType.ERROR,
            "action_url": "/dashboard/finances/tresorerie",
            "action_label": "Voir la trésorerie",
            "metadata": {
                "event_type": "treasury_negative_cashflow",
                "weeks_count": weeks_count
            }
        }
