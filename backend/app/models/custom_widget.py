"""
Custom Widget Model
SQLAlchemy model for user-created custom dashboard widgets
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Boolean, ForeignKey, Text, JSON, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class CustomWidget(Base):
    """Custom Widget model for user-created dashboard widgets"""
    __tablename__ = "custom_widgets"
    __table_args__ = (
        Index("idx_custom_widgets_user_id", "user_id"),
        Index("idx_custom_widgets_public", "is_public"),
        Index("idx_custom_widgets_type", "type"),
        Index("idx_custom_widgets_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=False, index=True)  # 'html', 'api', 'chart', 'text', 'iframe'
    config = Column(JSON, nullable=False)  # Configuration du widget
    data_source = Column(JSON, nullable=True)  # Source de données (API endpoint, query, etc.)
    style = Column(JSON, nullable=True)  # Styles personnalisés
    is_public = Column(Boolean, default=False, nullable=False, index=True)  # Partage avec autres utilisateurs
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="custom_widgets")

    def __repr__(self) -> str:
        return f"<CustomWidget(id={self.id}, name={self.name}, type={self.type}, user_id={self.user_id})>"
