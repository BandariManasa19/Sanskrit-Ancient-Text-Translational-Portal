"""
Upload Model - Stores details of user inputs (files, images, text)
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class FileType(enum.Enum):
    """Enum for supported file types"""
    IMAGE = "image"
    PDF = "pdf"
    DOC = "doc"
    TEXT = "text"
    SCANNED = "scanned"


class Upload(Base):
    """
    Upload model to store details of user inputs.
    Includes file type, file path, and extracted Sanskrit text.
    """
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # File information
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    
    # Extracted text
    original_text = Column(Text, nullable=True)  # Manual input or extracted text
    extracted_text = Column(Text, nullable=True)  # OCR extracted Sanskrit text
    extraction_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    extraction_error = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="uploads")
    translations = relationship("Translation", back_populates="upload", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Upload(id={self.id}, user_id={self.user_id}, file_type='{self.file_type}')>"
