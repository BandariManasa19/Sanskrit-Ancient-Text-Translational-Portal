import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiCopy, 
  FiDownload, 
  FiCheck,
  FiRefreshCw,
  FiClock,
  FiGlobe
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { translationAPI } from '../services/api';
import './TranslationOutput.css';

const TranslationOutput = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTranslated, setCopiedTranslated] = useState(false);

  const fetchTranslation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await translationAPI.getTranslation(id);
      setTranslation(response.data);
    } catch (err) {
      console.error('Error fetching translation:', err);
      setError(err.response?.data?.detail || 'Failed to load translation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTranslation();
  }, [fetchTranslation]);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'source') {
        setCopiedSource(true);
        setTimeout(() => setCopiedSource(false), 2000);
      } else {
        setCopiedTranslated(true);
        setTimeout(() => setCopiedTranslated(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const downloadAsText = () => {
    if (!translation) return;

    const content = `Sanskrit Text Translation
==========================

Original Sanskrit Text:
${translation.source_text}

Translated Text (${translation.target_language}):
${translation.translated_text}

---
Translated by Ancient Text Translational Portal
Date: ${new Date(translation.created_at).toLocaleString()}
Translation Engine: ${translation.translation_engine}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Translation downloaded!');
  };

  const getLanguageLabel = (code) => {
    const languages = {
      sanskrit: 'Sanskrit (संस्कृत)',
      telugu: 'Telugu (తెలుగు)',
      english: 'English',
      hindi: 'Hindi (हिन्दी)',
      kannada: 'Kannada (ಕನ್ನಡ)',
      tamil: 'Tamil (தமிழ்)',
      malayalam: 'Malayalam (മലയാളം)',
    };
    return languages[code] || code;
  };

  const getConfidenceLabel = (score) => {
    if (!score) return { label: 'Unknown', class: 'medium' };
    if (score >= 80) return { label: 'High', class: 'high' };
    if (score >= 60) return { label: 'Medium', class: 'medium' };
    return { label: 'Low', class: 'low' };
  };

  if (loading) {
    return (
      <div className="translation-output fade-in">
        <div className="loading-container">
          <div className="spinner large"></div>
          <p>Loading translation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="translation-output fade-in">
        <div className="error-container card">
          <h2>Error Loading Translation</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              <FiArrowLeft />
              <span>Go Back</span>
            </button>
            <button className="btn btn-primary" onClick={fetchTranslation}>
              <FiRefreshCw />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!translation) {
    return (
      <div className="translation-output fade-in">
        <div className="error-container card">
          <h2>Translation Not Found</h2>
          <p>The requested translation could not be found.</p>
          <Link to="/dashboard" className="btn btn-primary">
            <FiArrowLeft />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const confidence = getConfidenceLabel(translation.confidence_score);

  return (
    <div className="translation-output fade-in">
      {/* Header */}
      <div className="output-header">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft />
          <span>Back</span>
        </button>
        <h1>Translation Result</h1>
        <button className="btn btn-primary" onClick={downloadAsText}>
          <FiDownload />
          <span>Download</span>
        </button>
      </div>

      {/* Translation Info */}
      <div className="translation-info card">
        <div className="info-item">
          <FiGlobe />
          <span className="info-label">Languages:</span>
          <span className="info-value">
            {getLanguageLabel(translation.source_language)} → {getLanguageLabel(translation.target_language)}
          </span>
        </div>
        <div className="info-item">
          <FiClock />
          <span className="info-label">Translated:</span>
          <span className="info-value">
            {new Date(translation.created_at).toLocaleString()}
          </span>
        </div>
        <div className="info-item">
          <span className={`status-badge status-${translation.status}`}>
            {translation.status}
          </span>
        </div>
      </div>

      {/* Translation Status Check */}
      {translation.status === 'processing' && (
        <div className="processing-notice card">
          <div className="spinner"></div>
          <p>Translation is being processed. Please refresh in a moment.</p>
          <button className="btn btn-secondary" onClick={fetchTranslation}>
            <FiRefreshCw />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {translation.status === 'failed' && (
        <div className="error-notice card">
          <p>Translation failed: {translation.error_message || 'Unknown error'}</p>
          <Link to="/dashboard" className="btn btn-primary">
            Try Again
          </Link>
        </div>
      )}

      {/* Translation Content */}
      {translation.status === 'completed' && (
        <div className="translation-content">
          {/* Original Text */}
          <div className="text-panel card">
            <div className="panel-header">
              <h2>Original Sanskrit Text</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => copyToClipboard(translation.source_text, 'source')}
              >
                {copiedSource ? <FiCheck /> : <FiCopy />}
                <span>{copiedSource ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-content sanskrit-text">
              {translation.source_text}
            </div>
          </div>

          {/* Translated Text */}
          <div className="text-panel translated card">
            <div className="panel-header">
              <h2>Translated Text ({getLanguageLabel(translation.target_language)})</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => copyToClipboard(translation.translated_text, 'translated')}
              >
                {copiedTranslated ? <FiCheck /> : <FiCopy />}
                <span>{copiedTranslated ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className={`text-content ${translation.target_language}-text`}>
              {translation.translated_text}
            </div>

            {/* Confidence Score */}
            {translation.confidence_score && (
              <div className="confidence-section">
                <div className="confidence-header">
                  <span>Translation Confidence</span>
                  <span className={`confidence-label ${confidence.class}`}>
                    {confidence.label} ({translation.confidence_score}%)
                  </span>
                </div>
                <div className="confidence-meter">
                  <div
                    className={`confidence-fill confidence-${confidence.class}`}
                    style={{ width: `${translation.confidence_score}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="output-actions">
        <Link to="/dashboard" className="btn btn-primary">
          Translate Another Text
        </Link>
        <Link to="/history" className="btn btn-secondary">
          View History
        </Link>
      </div>
    </div>
  );
};

export default TranslationOutput;
