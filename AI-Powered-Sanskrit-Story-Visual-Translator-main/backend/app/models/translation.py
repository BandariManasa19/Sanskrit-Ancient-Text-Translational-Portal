"""
Translation Model - Stores translated outputs for different target languages
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Translation(Base):
    """
    Translation model to store translated outputs.
    Links to uploads and stores translations in various target languages.
    """
    __tablename__ = "translations"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=False)
    
    # Source and target information
    source_language = Column(String(50), default="sanskrit")
    target_language = Column(String(50), nullable=False)  # telugu, english, hindi
    
    # Text content
    source_text = Column(Text, nullable=False)
    translated_text = Column(Text, nullable=True)
    
    # Translation status
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    
    # Quality and metadata
    confidence_score = Column(Integer, nullable=True)  # 0-100
    translation_engine = Column(String(100), default="google")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    upload = relationship("Upload", back_populates="translations")

    def __repr__(self):
        return f"<Translation(id={self.id}, target='{self.target_language}', status='{self.status}')>"
