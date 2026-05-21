import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiClock, 
  FiFileText, 
  FiImage, 
  FiFile,
  FiChevronRight,
  FiRefreshCw,
  FiTrash2,
  FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { translationAPI } from '../services/api';
import './History.css';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await translationAPI.getHistory(50);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load translation history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this translation?')) {
      return;
    }

    setDeleting(id);
    try {
      await translationAPI.deleteTranslation(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success('Translation deleted');
    } catch (error) {
      console.error('Error deleting translation:', error);
      toast.error('Failed to delete translation');
    } finally {
      setDeleting(null);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return FiImage;
      case 'pdf':
      case 'doc':
        return FiFileText;
      default:
        return FiFile;
    }
  };

  const getLanguageLabel = (code) => {
    const languages = {
      telugu: 'Telugu',
      english: 'English',
      hindi: 'Hindi',
      kannada: 'Kannada',
      tamil: 'Tamil',
      malayalam: 'Malayalam',
    };
    return languages[code] || code;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredHistory = filter === 'all'
    ? history
    : history.filter((item) => item.target_language === filter);

  const languages = [...new Set(history.map((item) => item.target_language))];

  if (loading) {
    return (
      <div className="history-page fade-in">
        <div className="loading-container">
          <div className="spinner large"></div>
          <p>Loading translation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page fade-in">
      <div className="history-header">
        <div className="header-title">
          <h1>Translation History</h1>
          <p>View and manage your past translations</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchHistory}>
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state card">
          <FiClock className="empty-icon" />
          <h2>No Translation History</h2>
          <p>Your translated texts will appear here</p>
          <Link to="/dashboard" className="btn btn-primary">
            Start Translating
          </Link>
        </div>
      ) : (
        <>
          {/* Filter */}
          <div className="filter-section card">
            <div className="filter-label">
              <FiFilter />
              <span>Filter by language:</span>
            </div>
            <div className="filter-options">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({history.length})
              </button>
              {languages.map((lang) => (
                <button
                  key={lang}
                  className={`filter-btn ${filter === lang ? 'active' : ''}`}
                  onClick={() => setFilter(lang)}
                >
                  {getLanguageLabel(lang)} ({history.filter((h) => h.target_language === lang).length})
                </button>
              ))}
            </div>
          </div>

          {/* History List */}
          <div className="history-list">
            {filteredHistory.map((item) => {
              const FileIcon = getFileIcon(item.file_type);
              return (
                <Link
                  to={`/translation/${item.id}`}
                  key={item.id}
                  className="history-item card"
                >
                  <div className="history-item-icon">
                    <FileIcon />
                  </div>
                  <div className="history-item-content">
                    <div className="history-item-header">
                      <span className={`status-badge status-${item.status}`}>
                        {item.status}
                      </span>
                      <span className="history-item-lang">
                        Sanskrit → {getLanguageLabel(item.target_language)}
                      </span>
                    </div>
                    <p className="history-item-text sanskrit-text">
                      {item.source_text}
                    </p>
                    {item.translated_text && (
                      <p className="history-item-translated">
                        {item.translated_text}
                      </p>
                    )}
                    <div className="history-item-meta">
                      <span className="history-item-time">
                        <FiClock />
                        {formatDate(item.created_at)}
                      </span>
                      {item.file_name && (
                        <span className="history-item-file">
                          <FiFile />
                          {item.file_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="history-item-actions">
                    <button
                      className="btn-icon delete-btn"
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deleting === item.id}
                      title="Delete"
                    >
                      {deleting === item.id ? (
                        <div className="spinner small"></div>
                      ) : (
                        <FiTrash2 />
                      )}
                    </button>
                    <FiChevronRight className="chevron" />
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredHistory.length === 0 && (
            <div className="no-results card">
              <p>No translations found for the selected filter</p>
              <button className="btn btn-secondary" onClick={() => setFilter('all')}>
                Show All
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
