"""
Automation Rule Model
Rules for event-based automation
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class AutomationRule(Base):
    """Automation rule model for event-based automation"""
    
    __tablename__ = "automation_rules"
    __table_args__ = (
        Index("idx_automation_rules_enabled", "enabled"),
        Index("idx_automation_rules_trigger_event", "trigger_event"),
        Index("idx_automation_rules_user", "user_id"),
        Index("idx_automation_rules_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    enabled = Column(Boolean, default=True, nullable=False, index=True)
    
    # Trigger configuration
    trigger_event = Column(String(100), nullable=False, index=True)  # e.g., 'opportunity.stage_changed'
    trigger_conditions = Column(JSON, nullable=True)  # Additional conditions (field, operator, value)
    
    # Action configuration
    actions = Column(JSON, nullable=False)  # Array of actions to execute
    
    # Statistics
    trigger_count = Column(Integer, default=0, nullable=False)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="automation_rules")
    
    def __repr__(self) -> str:
        return f"<AutomationRule(id={self.id}, name={self.name}, enabled={self.enabled}, trigger_event={self.trigger_event})>"


class AutomationRuleExecutionLog(Base):
    """Log of automation rule executions"""
    
    __tablename__ = "automation_rule_execution_logs"
    __table_args__ = (
        Index("idx_automation_rule_logs_rule", "rule_id"),
        Index("idx_automation_rule_logs_executed_at", "executed_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("automation_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Execution details
    executed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    success = Column(Boolean, nullable=False)
    error_message = Column(Text, nullable=True)
    execution_data = Column(JSON, nullable=True)  # Context data when rule was triggered
    
    # Relationships
    rule = relationship("AutomationRule", backref="execution_logs")
    
    def __repr__(self) -> str:
        return f"<AutomationRuleExecutionLog(id={self.id}, rule_id={self.rule_id}, executed_at={self.executed_at}, success={self.success})>"
