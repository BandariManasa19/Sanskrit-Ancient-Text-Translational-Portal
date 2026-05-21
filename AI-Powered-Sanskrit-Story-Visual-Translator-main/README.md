# Ancient Text Translational Portal

A full-stack web application that translates ancient Sanskrit text into Telugu and other languages using modern AI-powered translation technologies.

## 🌟 Features

### Authentication System
- Secure user registration and login
- Password validation with strength requirements
- JWT-based authentication
- Protected routes for authenticated users only

### Multiple Input Formats
- **Manual Text Input**: Directly type or paste Sanskrit text
- **Image Upload (OCR)**: Upload scanned images for text extraction
- **Document Upload**: Support for PDF and Word documents

### Translation Capabilities
- Sanskrit to Telugu (default)
- Sanskrit to English
- Sanskrit to Hindi
- Sanskrit to Kannada
- Sanskrit to Tamil
- Sanskrit to Malayalam

### Translation Output
- Side-by-side display of original and translated text
- Translation confidence score
- Copy to clipboard functionality
- Download translations as text files
- Full translation history

## 🏗️ Project Structure

```
ancient-text-portal/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── models/            # SQLAlchemy models
│   │   │   ├── user.py        # User model
│   │   │   ├── upload.py      # Upload model
│   │   │   └── translation.py # Translation model
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.py        # Authentication routes
│   │   │   ├── upload.py      # Upload routes
│   │   │   └── translation.py # Translation routes
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── file_service.py
│   │   │   └── translation_service.py
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database setup
│   │   └── main.py            # FastAPI app
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Layout.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/           # React context
│   │   │   └── AuthContext.js
│   │   ├── pages/             # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── TranslationOutput.js
│   │   │   └── History.js
│   │   ├── services/          # API services
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn
- Tesseract OCR (for image text extraction)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env and set your SECRET_KEY
   ```

5. Run the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/api/docs`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

### Tesseract OCR Installation

For OCR functionality (extracting text from images):

**macOS:**
```bash
brew install tesseract
brew install tesseract-lang  # For additional languages
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-san  # Sanskrit support
```

**Windows:**
Download and install from [Tesseract GitHub](https://github.com/UB-Mannheim/tesseract/wiki)

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |
| PUT | `/api/auth/me` | Update user profile |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/logout` | Logout |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads/file` | Upload a file (image/PDF/DOC) |
| POST | `/api/uploads/text` | Submit text directly |
| GET | `/api/uploads/` | List all uploads |
| GET | `/api/uploads/{id}` | Get upload details |
| DELETE | `/api/uploads/{id}` | Delete an upload |

### Translations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/translations/` | Create translation from upload |
| POST | `/api/translations/direct` | Direct text translation |
| GET | `/api/translations/` | List all translations |
| GET | `/api/translations/history` | Get translation history |
| GET | `/api/translations/{id}` | Get translation details |
| GET | `/api/translations/{id}/result` | Get translation result |
| DELETE | `/api/translations/{id}` | Delete a translation |
| GET | `/api/translations/languages/supported` | Get supported languages |

## 🔐 Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **JWT Authentication**: Stateless token-based authentication
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character
- **Protected Routes**: All translation features require authentication
- **CORS Configuration**: Configured for frontend communication

## 🗄️ Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email
- `hashed_password`: Bcrypt hashed password
- `full_name`: Optional full name
- `is_active`: Account status
- `created_at`: Registration timestamp

### Uploads Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `file_name`: Original filename
- `file_type`: Type (image/pdf/doc/text)
- `file_path`: Storage path
- `extracted_text`: OCR/parsed text
- `extraction_status`: Status of extraction

### Translations Table
- `id`: Primary key
- `upload_id`: Foreign key to uploads
- `source_language`: Always "sanskrit"
- `target_language`: Selected target language
- `source_text`: Original text
- `translated_text`: Translated result
- `confidence_score`: Translation confidence
- `status`: Translation status

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation
- **JWT**: JSON Web Tokens for auth
- **Passlib + Bcrypt**: Password hashing
- **Pytesseract**: OCR for images
- **Deep Translator**: Translation API

### Frontend
- **React 18**: UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **React Dropzone**: File uploads
- **React Hot Toast**: Notifications
- **React Icons**: Icon library

## 📝 License

This project is for educational purposes - making ancient Sanskrit literature accessible through modern technology.

## 🙏 Acknowledgments

- Sanskrit scholars for preserving ancient wisdom
- Open source translation APIs
- Tesseract OCR project
