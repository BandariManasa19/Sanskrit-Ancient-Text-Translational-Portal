"""
Translation Schemas - Pydantic models for translation data validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TargetLanguage(str, Enum):
    """Supported target languages for translation"""
    TELUGU = "telugu"
    ENGLISH = "english"
    HINDI = "hindi"
    KANNADA = "kannada"
    TAMIL = "tamil"
    MALAYALAM = "malayalam"


class TranslationRequest(BaseModel):
    """Schema for translation request"""
    upload_id: int
    target_language: TargetLanguage = Field(default=TargetLanguage.TELUGU)
    source_text: Optional[str] = None  # Optional: can override extracted text


class DirectTranslationRequest(BaseModel):
    """Schema for direct text translation without upload"""
    source_text: str = Field(..., min_length=1, description="Sanskrit text to translate")
    target_language: TargetLanguage = Field(default=TargetLanguage.TELUGU)


class TranslationResponse(BaseModel):
    """Schema for translation response"""
    id: int
    upload_id: int
    source_language: str
    target_language: str
    source_text: str
    translated_text: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    confidence_score: Optional[int] = None
    translation_engine: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TranslationListResponse(BaseModel):
    """Schema for list of translations"""
    translations: List[TranslationResponse]
    total: int
    page: int
    page_size: int


class TranslationHistoryItem(BaseModel):
    """Schema for translation history item"""
    id: int
    source_text: str
    translated_text: Optional[str]
    source_language: str
    target_language: str
    status: str
    created_at: datetime
    file_name: Optional[str] = None
    file_type: str

    class Config:
        from_attributes = True


class TranslationResult(BaseModel):
    """Schema for translation result display"""
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    confidence_score: Optional[int] = None
    translation_engine: str
