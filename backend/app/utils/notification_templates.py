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
    
    @staticmethod
    def task_overdue(
        task_title: str,
        days_overdue: int,
        task_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for overdue task notification"""
        return {
            "title": "Tâche en retard",
            "message": f"La tâche '{task_title}' est en retard de {days_overdue} jour{'s' if days_overdue > 1 else ''}.",
            "type": NotificationType.ERROR,
            "action_url": f"/dashboard/projects/tasks{f'?task={task_id}' if task_id else ''}",
            "action_label": "Voir la tâche",
            "metadata": {
                "event_type": "task_overdue",
                "task_id": task_id,
                "task_title": task_title,
                "days_overdue": days_overdue
            }
        }
    
    @staticmethod
    def timesheet_submitted(
        employee_name: str,
        period: str,
        timesheet_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for timesheet submission notification"""
        return {
            "title": "Feuille de temps soumise",
            "message": f"{employee_name} a soumis sa feuille de temps pour la période {period}.",
            "type": NotificationType.INFO,
            "action_url": f"/dashboard/feuilles-de-temps{f'?entry={timesheet_id}' if timesheet_id else ''}",
            "action_label": "Voir la feuille de temps",
            "metadata": {
                "event_type": "timesheet_submitted",
                "timesheet_id": timesheet_id,
                "employee_name": employee_name,
                "period": period
            }
        }
    
    @staticmethod
    def timesheet_approved(
        period: str,
        timesheet_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for timesheet approval notification"""
        return {
            "title": "Feuille de temps approuvée",
            "message": f"Votre feuille de temps pour la période {period} a été approuvée.",
            "type": NotificationType.SUCCESS,
            "action_url": f"/dashboard/feuilles-de-temps{f'?entry={timesheet_id}' if timesheet_id else ''}",
            "action_label": "Voir la feuille de temps",
            "metadata": {
                "event_type": "timesheet_approved",
                "timesheet_id": timesheet_id,
                "period": period
            }
        }
    
    @staticmethod
    def timesheet_rejected(
        period: str,
        reason: Optional[str] = None,
        timesheet_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for timesheet rejection notification"""
        message = f"Votre feuille de temps pour la période {period} a été rejetée."
        if reason:
            message += f" Raison: {reason}."
        return {
            "title": "Feuille de temps rejetée",
            "message": message,
            "type": NotificationType.WARNING,
            "action_url": f"/dashboard/feuilles-de-temps{f'?entry={timesheet_id}' if timesheet_id else ''}",
            "action_label": "Voir la feuille de temps",
            "metadata": {
                "event_type": "timesheet_rejected",
                "timesheet_id": timesheet_id,
                "period": period,
                "reason": reason
            }
        }
    
    @staticmethod
    def expense_account_submitted(
        employee_name: str,
        amount: float,
        account_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for expense account submission notification"""
        return {
            "title": "Compte de dépenses soumis",
            "message": f"{employee_name} a soumis un compte de dépenses de {amount:,.2f} $.",
            "type": NotificationType.INFO,
            "action_url": f"/dashboard/compte-depenses{f'?account={account_id}' if account_id else ''}",
            "action_label": "Voir le compte de dépenses",
            "metadata": {
                "event_type": "expense_account_submitted",
                "account_id": account_id,
                "employee_name": employee_name,
                "amount": amount
            }
        }
    
    @staticmethod
    def expense_account_approved(
        amount: float,
        account_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for expense account approval notification"""
        return {
            "title": "Compte de dépenses approuvé",
            "message": f"Votre compte de dépenses de {amount:,.2f} $ a été approuvé.",
            "type": NotificationType.SUCCESS,
            "action_url": f"/dashboard/compte-depenses{f'?account={account_id}' if account_id else ''}",
            "action_label": "Voir le compte de dépenses",
            "metadata": {
                "event_type": "expense_account_approved",
                "account_id": account_id,
                "amount": amount
            }
        }
    
    @staticmethod
    def expense_account_rejected(
        amount: float,
        reason: Optional[str] = None,
        account_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for expense account rejection notification"""
        message = f"Votre compte de dépenses de {amount:,.2f} $ a été rejeté."
        if reason:
            message += f" Raison: {reason}."
        return {
            "title": "Compte de dépenses rejeté",
            "message": message,
            "type": NotificationType.WARNING,
            "action_url": f"/dashboard/compte-depenses{f'?account={account_id}' if account_id else ''}",
            "action_label": "Voir le compte de dépenses",
            "metadata": {
                "event_type": "expense_account_rejected",
                "account_id": account_id,
                "amount": amount,
                "reason": reason
            }
        }
    
    @staticmethod
    def invoice_paid(
        invoice_number: str,
        amount: float,
        invoice_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for invoice payment notification"""
        return {
            "title": "Facture payée",
            "message": f"La facture '{invoice_number}' a été payée ({amount:,.2f} $).",
            "type": NotificationType.SUCCESS,
            "action_url": f"/dashboard/finances/facturations{f'?invoice={invoice_id}' if invoice_id else ''}",
            "action_label": "Voir la facture",
            "metadata": {
                "event_type": "invoice_paid",
                "invoice_id": invoice_id,
                "invoice_number": invoice_number,
                "amount": amount
            }
        }
    
    @staticmethod
    def invoice_overdue(
        invoice_number: str,
        days_overdue: int,
        amount: float,
        invoice_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for overdue invoice notification"""
        return {
            "title": "Facture en retard",
            "message": f"La facture '{invoice_number}' est en retard de {days_overdue} jour{'s' if days_overdue > 1 else ''} ({amount:,.2f} $).",
            "type": NotificationType.ERROR,
            "action_url": f"/dashboard/finances/facturations{f'?invoice={invoice_id}' if invoice_id else ''}",
            "action_label": "Voir la facture",
            "metadata": {
                "event_type": "invoice_overdue",
                "invoice_id": invoice_id,
                "invoice_number": invoice_number,
                "days_overdue": days_overdue,
                "amount": amount
            }
        }
    
    @staticmethod
    def opportunity_created(
        opportunity_name: str,
        opportunity_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for opportunity creation notification"""
        return {
            "title": "Nouvelle opportunité assignée",
            "message": f"Une nouvelle opportunité '{opportunity_name}' vous a été assignée.",
            "type": NotificationType.INFO,
            "action_url": f"/dashboard/opportunites{f'?opportunity={opportunity_id}' if opportunity_id else ''}",
            "action_label": "Voir l'opportunité",
            "metadata": {
                "event_type": "opportunity_created",
                "opportunity_id": opportunity_id,
                "opportunity_name": opportunity_name
            }
        }
    
    @staticmethod
    def opportunity_won(
        opportunity_name: str,
        amount: Optional[float] = None,
        opportunity_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for opportunity won notification"""
        message = f"L'opportunité '{opportunity_name}' a été gagnée !"
        if amount:
            message += f" ({amount:,.2f} $)"
        return {
            "title": "Opportunité gagnée",
            "message": message,
            "type": NotificationType.SUCCESS,
            "action_url": f"/dashboard/opportunites{f'?opportunity={opportunity_id}' if opportunity_id else ''}",
            "action_label": "Voir l'opportunité",
            "metadata": {
                "event_type": "opportunity_won",
                "opportunity_id": opportunity_id,
                "opportunity_name": opportunity_name,
                "amount": amount
            }
        }
    
    @staticmethod
    def mention_in_comment(
        author_name: str,
        context: str,
        comment_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Template for mention in comment notification"""
        return {
            "title": "Vous avez été mentionné",
            "message": f"{author_name} vous a mentionné dans un commentaire: {context}",
            "type": NotificationType.INFO,
            "action_url": f"/dashboard/comments{f'?comment={comment_id}' if comment_id else ''}",
            "action_label": "Voir le commentaire",
            "metadata": {
                "event_type": "mention_in_comment",
                "comment_id": comment_id,
                "author_name": author_name
            }
        }
