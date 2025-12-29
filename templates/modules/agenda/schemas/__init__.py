"""
Schemas pour le module Agenda
"""

from templates.modules.agenda.schemas.evenement import (
    EvenementBase,
    EvenementCreate,
    EvenementUpdate,
    EvenementResponse,
)
from templates.modules.agenda.schemas.absence import (
    AbsenceBase,
    AbsenceCreate,
    AbsenceUpdate,
    AbsenceResponse,
)
from templates.modules.agenda.schemas.deadline import (
    DeadlineBase,
    DeadlineCreate,
    DeadlineUpdate,
    DeadlineResponse,
)

__all__ = [
    "EvenementBase",
    "EvenementCreate",
    "EvenementUpdate",
    "EvenementResponse",
    "AbsenceBase",
    "AbsenceCreate",
    "AbsenceUpdate",
    "AbsenceResponse",
    "DeadlineBase",
    "DeadlineCreate",
    "DeadlineUpdate",
    "DeadlineResponse",
]
