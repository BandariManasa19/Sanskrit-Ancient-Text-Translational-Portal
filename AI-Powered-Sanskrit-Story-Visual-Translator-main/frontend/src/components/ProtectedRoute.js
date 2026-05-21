import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    const loadingScreenStyle = {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
    };

    const loadingContentStyle = {
      textAlign: 'center',
      color: 'white',
    };

    const spinnerStyle = {
      width: '48px',
      height: '48px',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '0 auto 1rem',
    };

    return (
      <div style={loadingScreenStyle}>
        <div style={loadingContentStyle}>
          <div style={spinnerStyle} className="spinner"></div>
          <p>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
