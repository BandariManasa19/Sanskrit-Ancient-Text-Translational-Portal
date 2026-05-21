"""
Upload Schemas - Pydantic models for file upload validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UploadBase(BaseModel):
    """Base upload schema"""
    file_type: str
    original_text: Optional[str] = None


class UploadCreate(BaseModel):
    """Schema for creating an upload (manual text input)"""
    original_text: str = Field(..., min_length=1, description="Sanskrit text to translate")
    file_type: str = Field(default="text")


class UploadResponse(BaseModel):
    """Schema for upload response"""
    id: int
    user_id: int
    file_name: Optional[str] = None
    file_type: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    original_text: Optional[str] = None
    extracted_text: Optional[str] = None
    extraction_status: str
    extraction_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UploadListResponse(BaseModel):
    """Schema for list of uploads"""
    uploads: List[UploadResponse]
    total: int
    page: int
    page_size: int


class TextExtractionRequest(BaseModel):
    """Schema for text extraction request"""
    upload_id: int


class TextExtractionResponse(BaseModel):
    """Schema for text extraction response"""
    upload_id: int
    extracted_text: str
    status: str
    message: Optional[str] = None
