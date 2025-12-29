"""
Models pour le module Agenda
"""

from templates.modules.agenda.models.evenement import Evenement, EventType, EventStatus
from templates.modules.agenda.models.absence import Absence, AbsenceType, AbsenceStatus
from templates.modules.agenda.models.deadline import Deadline, DeadlinePriority, DeadlineStatus

__all__ = [
    "Evenement",
    "EventType",
    "EventStatus",
    "Absence",
    "AbsenceType",
    "AbsenceStatus",
    "Deadline",
    "DeadlinePriority",
    "DeadlineStatus",
]
