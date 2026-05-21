"""
File Processing Service - Handles file uploads and text extraction
"""
import os
import uuid
from datetime import datetime
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from PIL import Image
import pytesseract
from PyPDF2 import PdfReader
from docx import Document
import io

from app.config import settings
from app.models.upload import Upload


class FileProcessor:
    """Service for processing uploaded files and extracting text"""
    
    ALLOWED_EXTENSIONS = settings.ALLOWED_EXTENSIONS
    MAX_FILE_SIZE = settings.MAX_FILE_SIZE
    UPLOAD_DIR = settings.UPLOAD_DIR
    
    def __init__(self):
        """Initialize file processor and create upload directory"""
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
    
    def validate_file(self, file: UploadFile) -> Tuple[bool, str]:
        """
        Validate uploaded file type and size.
        
        Args:
            file: Uploaded file object
        
        Returns:
            Tuple of (is_valid, message)
        """
        # Check file extension
        if file.filename:
            extension = file.filename.split('.')[-1].lower()
            if extension not in self.ALLOWED_EXTENSIONS:
                return False, f"File type '.{extension}' is not allowed. Allowed types: {', '.join(self.ALLOWED_EXTENSIONS)}"
        
        return True, "File is valid"
    
    def get_file_type(self, filename: str) -> str:
        """
        Determine file type from filename extension.
        
        Args:
            filename: Name of the file
        
        Returns:
            File type string
        """
        extension = filename.split('.')[-1].lower()
        
        if extension in ['png', 'jpg', 'jpeg']:
            return 'image'
        elif extension == 'pdf':
            return 'pdf'
        elif extension in ['doc', 'docx']:
            return 'doc'
        elif extension == 'txt':
            return 'text'
        else:
            return 'unknown'
    
    async def save_file(self, file: UploadFile, user_id: int) -> Tuple[str, str]:
        """
        Save uploaded file to disk.
        
        Args:
            file: Uploaded file object
            user_id: ID of the user uploading the file
        
        Returns:
            Tuple of (file_path, unique_filename)
        """
        # Create user-specific directory
        user_dir = os.path.join(self.UPLOAD_DIR, str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        
        # Generate unique filename
        extension = file.filename.split('.')[-1].lower()
        unique_filename = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{extension}"
        file_path = os.path.join(user_dir, unique_filename)
        
        # Save file
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        return file_path, unique_filename
    
    def extract_text_from_image(self, file_path: str, lang: str = 'san+eng') -> str:
        """
        Extract text from image using OCR (Tesseract).
        
        Args:
            file_path: Path to the image file
            lang: OCR language (san for Sanskrit, eng for English)
        
        Returns:
            Extracted text string
        """
        try:
            image = Image.open(file_path)
            # Use Tesseract for OCR with Sanskrit and English language support
            text = pytesseract.image_to_string(image, lang=lang)
            return text.strip()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract text from image: {str(e)}"
            )
    
    def extract_text_from_pdf(self, file_path: str, lang: str = 'san+eng') -> str:
        """
        Extract text from PDF file. Uses OCR as fallback for image-based PDFs.
        
        Args:
            file_path: Path to the PDF file
            lang: OCR language (san for Sanskrit, eng for English)
        
        Returns:
            Extracted text string
        """
        try:
            import pdf2image
            
            reader = PdfReader(file_path)
            text_parts = []
            
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            
            extracted_text = '\n'.join(text_parts).strip()
            
            # If no text was extracted, the PDF might be image-based, use OCR
            if not extracted_text:
                try:
                    # Convert PDF pages to images and run OCR
                    images = pdf2image.convert_from_path(file_path)
                    ocr_text_parts = []
                    
                    for i, image in enumerate(images):
                        page_text = pytesseract.image_to_string(image, lang=lang)
                        if page_text.strip():
                            ocr_text_parts.append(page_text.strip())
                    
                    extracted_text = '\n'.join(ocr_text_parts).strip()
                except Exception as ocr_error:
                    # If pdf2image is not installed or fails, return empty with a note
                    print(f"OCR fallback failed: {str(ocr_error)}")
            
            return extracted_text
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract text from PDF: {str(e)}"
            )
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """
        Extract text from Word document.
        
        Args:
            file_path: Path to the DOCX file
        
        Returns:
            Extracted text string
        """
        try:
            doc = Document(file_path)
            text_parts = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text:
                    text_parts.append(paragraph.text)
            
            return '\n'.join(text_parts).strip()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract text from document: {str(e)}"
            )
    
    def extract_text(self, file_path: str, file_type: str) -> str:
        """
        Extract text based on file type.
        
        Args:
            file_path: Path to the file
            file_type: Type of the file
        
        Returns:
            Extracted text string
        """
        if file_type == 'image':
            return self.extract_text_from_image(file_path)
        elif file_type == 'pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_type == 'doc':
            return self.extract_text_from_docx(file_path)
        elif file_type == 'text':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_type}"
            )
    
    async def process_upload(
        self,
        db: Session,
        file: UploadFile,
        user_id: int
    ) -> Upload:
        """
        Process file upload: validate, save, and extract text.
        
        Args:
            db: Database session
            file: Uploaded file
            user_id: ID of the user
        
        Returns:
            Upload model instance
        """
        # Validate file
        is_valid, message = self.validate_file(file)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Get file type
        file_type = self.get_file_type(file.filename)
        
        # Save file
        file_path, unique_filename = await self.save_file(file, user_id)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Create upload record
        upload = Upload(
            user_id=user_id,
            file_name=file.filename,
            file_type=file_type,
            file_path=file_path,
            file_size=file_size,
            extraction_status="processing"
        )
        
        db.add(upload)
        db.commit()
        db.refresh(upload)
        
        # Extract text
        try:
            extracted_text = self.extract_text(file_path, file_type)
            upload.extracted_text = extracted_text
            upload.extraction_status = "completed"
        except Exception as e:
            upload.extraction_status = "failed"
            upload.extraction_error = str(e)
        
        db.commit()
        db.refresh(upload)
        
        return upload


# Create singleton instance
file_processor = FileProcessor()
