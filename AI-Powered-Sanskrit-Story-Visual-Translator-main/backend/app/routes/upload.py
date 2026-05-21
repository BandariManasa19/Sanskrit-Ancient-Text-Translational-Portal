"""
Upload Routes - Handles file uploads and text extraction
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.upload import Upload
from app.schemas.upload import (
    UploadCreate,
    UploadResponse,
    UploadListResponse,
    TextExtractionResponse
)
from app.services.auth_service import get_current_active_user
from app.services.file_service import file_processor

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])


@router.post("/file", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file (image, PDF, or document) for text extraction.
    
    Supported formats:
    - Images: PNG, JPG, JPEG (OCR will be performed)
    - PDF documents
    - Word documents: DOC, DOCX
    - Text files: TXT
    """
    upload = await file_processor.process_upload(db, file, current_user.id)
    return upload


@router.post("/text", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_text(
    upload_data: UploadCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submit Sanskrit text directly for translation.
    
    - **original_text**: Sanskrit text to translate
    """
    # Create upload record for manual text input
    upload = Upload(
        user_id=current_user.id,
        file_type="text",
        original_text=upload_data.original_text,
        extracted_text=upload_data.original_text,
        extraction_status="completed"
    )
    
    db.add(upload)
    db.commit()
    db.refresh(upload)
    
    return upload


@router.get("/", response_model=UploadListResponse)
async def list_uploads(
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all uploads for the current user.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 10)
    """
    query = db.query(Upload).filter(
        Upload.user_id == current_user.id
    ).order_by(Upload.created_at.desc())
    
    total = query.count()
    uploads = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return UploadListResponse(
        uploads=uploads,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{upload_id}", response_model=UploadResponse)
async def get_upload(
    upload_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific upload.
    
    - **upload_id**: ID of the upload
    """
    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    return upload


@router.delete("/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_upload(
    upload_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete an upload and its associated translations.
    
    - **upload_id**: ID of the upload to delete
    """
    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    db.delete(upload)
    db.commit()
    
    return None


@router.post("/{upload_id}/extract", response_model=TextExtractionResponse)
async def re_extract_text(
    upload_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Re-extract text from an uploaded file.
    
    - **upload_id**: ID of the upload
    """
    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    if not upload.file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file associated with this upload"
        )
    
    try:
        extracted_text = file_processor.extract_text(upload.file_path, upload.file_type)
        upload.extracted_text = extracted_text
        upload.extraction_status = "completed"
        upload.extraction_error = None
        db.commit()
        
        return TextExtractionResponse(
            upload_id=upload.id,
            extracted_text=extracted_text,
            status="completed",
            message="Text extraction successful"
        )
    except Exception as e:
        upload.extraction_status = "failed"
        upload.extraction_error = str(e)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}"
        )
