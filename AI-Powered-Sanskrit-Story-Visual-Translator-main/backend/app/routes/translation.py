"""
Translation Routes - Handles text translation requests
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.upload import Upload
from app.models.translation import Translation
from app.schemas.translation import (
    TranslationRequest,
    DirectTranslationRequest,
    TranslationResponse,
    TranslationListResponse,
    TranslationHistoryItem,
    TranslationResult,
    TargetLanguage
)
from app.services.auth_service import get_current_active_user
from app.services.translation_service import translation_service

router = APIRouter(prefix="/api/translations", tags=["Translations"])


@router.post("/", response_model=TranslationResponse, status_code=status.HTTP_201_CREATED)
async def create_translation(
    request: TranslationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a translation for an uploaded text.
    
    - **upload_id**: ID of the upload containing Sanskrit text
    - **target_language**: Target language (default: Telugu)
    - **source_text**: Optional override for the source text
    """
    # Verify upload belongs to user
    upload = db.query(Upload).filter(
        Upload.id == request.upload_id,
        Upload.user_id == current_user.id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    # Get source text
    source_text = request.source_text or upload.extracted_text or upload.original_text
    
    if not source_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No text available for translation"
        )
    
    # Create translation
    translation = translation_service.create_translation(
        db=db,
        upload_id=upload.id,
        source_text=source_text,
        target_language=request.target_language.value
    )
    
    return translation


@router.post("/direct", response_model=TranslationResponse, status_code=status.HTTP_201_CREATED)
async def translate_directly(
    request: DirectTranslationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Translate Sanskrit text directly without creating an upload first.
    
    - **source_text**: Sanskrit text to translate
    - **target_language**: Target language (default: Telugu)
    """
    # Create an upload record for this direct translation
    upload = Upload(
        user_id=current_user.id,
        file_type="text",
        original_text=request.source_text,
        extracted_text=request.source_text,
        extraction_status="completed"
    )
    
    db.add(upload)
    db.commit()
    db.refresh(upload)
    
    # Create translation
    translation = translation_service.create_translation(
        db=db,
        upload_id=upload.id,
        source_text=request.source_text,
        target_language=request.target_language.value
    )
    
    return translation


@router.get("/", response_model=TranslationListResponse)
async def list_translations(
    page: int = 1,
    page_size: int = 10,
    target_language: Optional[TargetLanguage] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all translations for the current user.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 10)
    - **target_language**: Optional filter by target language
    """
    query = db.query(Translation).join(Upload).filter(
        Upload.user_id == current_user.id
    )
    
    if target_language:
        query = query.filter(Translation.target_language == target_language.value)
    
    query = query.order_by(Translation.created_at.desc())
    
    total = query.count()
    translations = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return TranslationListResponse(
        translations=translations,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/history", response_model=List[TranslationHistoryItem])
async def get_translation_history(
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get recent translation history for the current user.
    
    - **limit**: Maximum number of history items (default: 20)
    """
    translations = db.query(Translation).join(Upload).filter(
        Upload.user_id == current_user.id
    ).order_by(Translation.created_at.desc()).limit(limit).all()
    
    history = []
    for t in translations:
        history.append(TranslationHistoryItem(
            id=t.id,
            source_text=t.source_text[:200] + "..." if len(t.source_text) > 200 else t.source_text,
            translated_text=t.translated_text[:200] + "..." if t.translated_text and len(t.translated_text) > 200 else t.translated_text,
            source_language=t.source_language,
            target_language=t.target_language,
            status=t.status,
            created_at=t.created_at,
            file_name=t.upload.file_name,
            file_type=t.upload.file_type
        ))
    
    return history


@router.get("/{translation_id}", response_model=TranslationResponse)
async def get_translation(
    translation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific translation.
    
    - **translation_id**: ID of the translation
    """
    translation = translation_service.get_translation_by_id(
        db, translation_id, current_user.id
    )
    
    if not translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found"
        )
    
    return translation


@router.get("/{translation_id}/result", response_model=TranslationResult)
async def get_translation_result(
    translation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the translation result for display.
    
    - **translation_id**: ID of the translation
    """
    translation = translation_service.get_translation_by_id(
        db, translation_id, current_user.id
    )
    
    if not translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found"
        )
    
    if translation.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Translation is not completed. Current status: {translation.status}"
        )
    
    return TranslationResult(
        original_text=translation.source_text,
        translated_text=translation.translated_text,
        source_language=translation.source_language,
        target_language=translation.target_language,
        confidence_score=translation.confidence_score,
        translation_engine=translation.translation_engine
    )


@router.delete("/{translation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_translation(
    translation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific translation.
    
    - **translation_id**: ID of the translation to delete
    """
    translation = translation_service.get_translation_by_id(
        db, translation_id, current_user.id
    )
    
    if not translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found"
        )
    
    db.delete(translation)
    db.commit()
    
    return None


@router.get("/languages/supported")
async def get_supported_languages():
    """
    Get list of supported target languages.
    """
    return {
        "source_language": "sanskrit",
        "target_languages": [
            {"code": "telugu", "name": "Telugu", "native_name": "తెలుగు"},
            {"code": "english", "name": "English", "native_name": "English"},
            {"code": "hindi", "name": "Hindi", "native_name": "हिन्दी"},
            {"code": "kannada", "name": "Kannada", "native_name": "ಕನ್ನಡ"},
            {"code": "tamil", "name": "Tamil", "native_name": "தமிழ்"},
            {"code": "malayalam", "name": "Malayalam", "native_name": "മലയാളം"}
        ]
    }
