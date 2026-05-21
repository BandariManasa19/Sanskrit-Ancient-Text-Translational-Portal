import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { 
  FiUpload, 
  FiFile, 
  FiImage, 
  FiFileText, 
  FiType,
  FiX,
  FiGlobe,
  FiZap
} from 'react-icons/fi';
import { uploadAPI, translationAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [sanskritText, setSanskritText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('telugu');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [uploadId, setUploadId] = useState(null);

  const navigate = useNavigate();

  const languages = [
    { code: 'telugu', name: 'Telugu', native: 'తెలుగు' },
    { code: 'english', name: 'English', native: 'English' },
    { code: 'hindi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'kannada', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'tamil', name: 'Tamil', native: 'தமிழ்' },
    { code: 'malayalam', name: 'Malayalam', native: 'മലയാളം' },
  ];

  const tabs = [
    { id: 'text', label: 'Manual Text', icon: FiType },
    { id: 'image', label: 'Image (OCR)', icon: FiImage },
    { id: 'document', label: 'Document', icon: FiFileText },
  ];

  // File dropzone handler
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadedFile(file);
    setExtractedText('');
    setUploadId(null);

    // Upload and extract text
    setLoading(true);
    try {
      const response = await uploadAPI.uploadFile(file);
      const upload = response.data;
      
      setUploadId(upload.id);
      
      if (upload.extraction_status === 'completed' && upload.extracted_text) {
        setExtractedText(upload.extracted_text);
        toast.success('Text extracted successfully!');
      } else if (upload.extraction_status === 'failed') {
        toast.error(upload.extraction_error || 'Failed to extract text from file');
      } else {
        toast.success('File uploaded. Text extraction may take a moment...');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
      setUploadedFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: activeTab === 'image' 
      ? { 'image/*': ['.png', '.jpg', '.jpeg'] }
      : { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: loading,
  });

  const handleTextTranslation = async () => {
    if (!sanskritText.trim()) {
      toast.error('Please enter Sanskrit text to translate');
      return;
    }

    setLoading(true);
    try {
      const response = await translationAPI.translateDirect(sanskritText, targetLanguage);
      navigate(`/translation/${response.data.id}`);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(error.response?.data?.detail || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileTranslation = async () => {
    const textToTranslate = extractedText || '';
    
    if (!textToTranslate.trim()) {
      toast.error('No text available for translation. Please upload a file first.');
      return;
    }

    if (!uploadId) {
      toast.error('Please upload a file first');
      return;
    }

    setLoading(true);
    try {
      const response = await translationAPI.createTranslation(uploadId, targetLanguage);
      navigate(`/translation/${response.data.id}`);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(error.response?.data?.detail || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setExtractedText('');
    setUploadId(null);
  };

  const getFileIcon = (file) => {
    if (!file) return FiFile;
    const type = file.type;
    if (type.startsWith('image/')) return FiImage;
    if (type.includes('pdf')) return FiFileText;
    return FiFile;
  };

  const FileIcon = uploadedFile ? getFileIcon(uploadedFile) : FiFile;

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1>Translation Dashboard</h1>
        <p>Translate ancient Sanskrit texts into Telugu and other languages</p>
      </div>

      <div className="dashboard-content">
        <div className="translation-section card">
          {/* Input Type Tabs */}
          <div className="tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    clearUpload();
                    setSanskritText('');
                  }}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Language Selection */}
          <div className="language-section">
            <label className="section-label">
              <FiGlobe />
              <span>Select Target Language</span>
            </label>
            <div className="language-selector">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`language-option ${targetLanguage === lang.code ? 'selected' : ''}`}
                  onClick={() => setTargetLanguage(lang.code)}
                >
                  <span className="lang-name">{lang.name}</span>
                  <span className="lang-native">{lang.native}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Section */}
          <div className="input-section">
            {activeTab === 'text' ? (
              <div className="text-input-section">
                <label className="section-label">
                  <FiType />
                  <span>Enter Sanskrit Text</span>
                </label>
                <textarea
                  className="text-input-area input-field sanskrit-text"
                  placeholder="पस्ते ससंकृत पाठ यहां...&#10;Paste your Sanskrit text here..."
                  value={sanskritText}
                  onChange={(e) => setSanskritText(e.target.value)}
                  rows={8}
                />
                <div className="input-actions">
                  <span className="char-count">{sanskritText.length} characters</span>
                  <button
                    className="btn btn-primary translate-btn"
                    onClick={handleTextTranslation}
                    disabled={loading || !sanskritText.trim()}
                  >
                    {loading ? (
                      <>
                        <div className="spinner" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <FiZap />
                        <span>Translate to {languages.find(l => l.code === targetLanguage)?.name}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="file-upload-section">
                <label className="section-label">
                  <FiUpload />
                  <span>
                    {activeTab === 'image' ? 'Upload Image (OCR)' : 'Upload Document'}
                  </span>
                </label>

                {!uploadedFile ? (
                  <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'active' : ''} ${loading ? 'disabled' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <FiUpload className="dropzone-icon" />
                    <p className="dropzone-text">
                      {isDragActive
                        ? 'Drop the file here...'
                        : activeTab === 'image'
                        ? 'Drag & drop an image, or click to select'
                        : 'Drag & drop a document, or click to select'}
                    </p>
                    <p className="dropzone-hint">
                      {activeTab === 'image'
                        ? 'Supports: PNG, JPG, JPEG (max 10MB)'
                        : 'Supports: PDF, DOC, DOCX (max 10MB)'}
                    </p>
                  </div>
                ) : (
                  <div className="upload-preview">
                    <div className="upload-preview-icon">
                      <FileIcon />
                    </div>
                    <div className="upload-preview-info">
                      <span className="file-name">{uploadedFile.name}</span>
                      <span className="file-size">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button className="btn-icon" onClick={clearUpload} title="Remove file">
                      <FiX />
                    </button>
                  </div>
                )}

                {/* Extracted Text Preview */}
                {extractedText && (
                  <div className="extracted-text-section">
                    <label className="section-label">
                      <FiFileText />
                      <span>Extracted Text</span>
                    </label>
                    <div className="text-output-area sanskrit-text">
                      {extractedText}
                    </div>
                  </div>
                )}

                <div className="input-actions">
                  <button
                    className="btn btn-primary translate-btn"
                    onClick={handleFileTranslation}
                    disabled={loading || !extractedText}
                  >
                    {loading ? (
                      <>
                        <div className="spinner" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiZap />
                        <span>Translate to {languages.find(l => l.code === targetLanguage)?.name}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="info-section">
          <div className="info-card card">
            <h3>📜 How It Works</h3>
            <ol>
              <li>Choose your input method (text, image, or document)</li>
              <li>Enter or upload Sanskrit content</li>
              <li>Select your target language</li>
              <li>Click translate and view results!</li>
            </ol>
          </div>
          <div className="info-card card">
            <h3>💡 Tips</h3>
            <ul>
              <li>For best OCR results, use clear, high-resolution images</li>
              <li>Sanskrit Devanagari script works best for translation</li>
              <li>Check your translation history for previous work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
