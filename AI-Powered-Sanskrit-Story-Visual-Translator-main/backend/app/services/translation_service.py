"""
Translation Service - Handles Sanskrit text translation to various languages
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from deep_translator import GoogleTranslator
from app.models.translation import Translation
from app.models.upload import Upload
from app.schemas.translation import TargetLanguage


class TranslationService:
    """Service for translating Sanskrit text to various languages"""
    
    # Language code mapping for Google Translate
    LANGUAGE_CODES = {
        "sanskrit": "sa",
        "telugu": "te",
        "english": "en",
        "hindi": "hi",
        "kannada": "kn",
        "tamil": "ta",
        "malayalam": "ml"
    }
    
    def __init__(self):
        """Initialize translation service"""
        pass
    
    def get_language_code(self, language: str) -> str:
        """
        Get Google Translate language code.
        
        Args:
            language: Language name
        
        Returns:
            Language code string
        """
        return self.LANGUAGE_CODES.get(language.lower(), "en")
    
    def translate_text(
        self,
        text: str,
        source_language: str = "sanskrit",
        target_language: str = "telugu"
    ) -> tuple[str, int]:
        """
        Translate text from source language to target language.
        
        Args:
            text: Text to translate
            source_language: Source language name
            target_language: Target language name
        
        Returns:
            Tuple of (translated_text, confidence_score)
        """
        source_code = self.get_language_code(source_language)
        target_code = self.get_language_code(target_language)
        
        try:
            translator = GoogleTranslator(source=source_code, target=target_code)
            
            # Handle long text by splitting into chunks
            max_chars = 4500  # Google Translate limit is ~5000
            if len(text) > max_chars:
                chunks = [text[i:i+max_chars] for i in range(0, len(text), max_chars)]
                translated_chunks = []
                
                for chunk in chunks:
                    translated_chunk = translator.translate(chunk)
                    translated_chunks.append(translated_chunk)
                
                translated_text = ' '.join(translated_chunks)
            else:
                translated_text = translator.translate(text)
            
            # Estimate confidence (based on text length and complexity)
            confidence = self._estimate_confidence(text, translated_text)
            
            return translated_text, confidence
            
        except Exception as e:
            raise Exception(f"Translation failed: {str(e)}")
    
    def _estimate_confidence(self, source: str, translated: str) -> int:
        """
        Estimate translation confidence score.
        
        Args:
            source: Source text
            translated: Translated text
        
        Returns:
            Confidence score (0-100)
        """
        # Basic confidence estimation based on text properties
        if not translated or translated == source:
            return 50
        
        # Higher confidence for reasonable translation ratios
        source_len = len(source)
        translated_len = len(translated)
        
        ratio = translated_len / source_len if source_len > 0 else 0
        
        if 0.3 <= ratio <= 3.0:
            return 85
        elif 0.1 <= ratio <= 5.0:
            return 70
        else:
            return 60
    
    def create_translation(
        self,
        db: Session,
        upload_id: int,
        source_text: str,
        target_language: str
    ) -> Translation:
        """
        Create a translation record and perform translation.
        
        Args:
            db: Database session
            upload_id: ID of the upload
            source_text: Text to translate
            target_language: Target language
        
        Returns:
            Translation model instance
        """
        # Create translation record
        translation = Translation(
            upload_id=upload_id,
            source_language="sanskrit",
            target_language=target_language,
            source_text=source_text,
            status="processing",
            translation_engine="google"
        )
        
        db.add(translation)
        db.commit()
        db.refresh(translation)
        
        try:
            # Perform translation
            translated_text, confidence = self.translate_text(
                source_text,
                "sanskrit",
                target_language
            )
            
            translation.translated_text = translated_text
            translation.confidence_score = confidence
            translation.status = "completed"
            translation.completed_at = datetime.utcnow()
            
        except Exception as e:
            translation.status = "failed"
            translation.error_message = str(e)
        
        db.commit()
        db.refresh(translation)
        
        return translation
    
    def get_user_translations(
        self,
        db: Session,
        user_id: int,
        page: int = 1,
        page_size: int = 10
    ) -> tuple[list[Translation], int]:
        """
        Get translation history for a user.
        
        Args:
            db: Database session
            user_id: ID of the user
            page: Page number
            page_size: Number of items per page
        
        Returns:
            Tuple of (translations_list, total_count)
        """
        query = db.query(Translation).join(Upload).filter(
            Upload.user_id == user_id
        ).order_by(Translation.created_at.desc())
        
        total = query.count()
        translations = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return translations, total
    
    def get_translation_by_id(
        self,
        db: Session,
        translation_id: int,
        user_id: int
    ) -> Optional[Translation]:
        """
        Get a specific translation by ID for a user.
        
        Args:
            db: Database session
            translation_id: ID of the translation
            user_id: ID of the user
        
        Returns:
            Translation if found and belongs to user, None otherwise
        """
        return db.query(Translation).join(Upload).filter(
            Translation.id == translation_id,
            Upload.user_id == user_id
        ).first()


# Create singleton instance
translation_service = TranslationService()
