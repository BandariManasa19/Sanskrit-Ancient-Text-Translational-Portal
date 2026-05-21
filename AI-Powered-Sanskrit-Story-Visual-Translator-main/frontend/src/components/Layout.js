import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiClock, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiUser,
  FiBook
} from 'react-icons/fi';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <FiBook className="brand-icon" />
            <span className="brand-text">Sanskrit Translator</span>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-menu desktop-only">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FiHome />
              <span>Dashboard</span>
            </NavLink>
            <NavLink 
              to="/history" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FiClock />
              <span>History</span>
            </NavLink>
          </div>

          <div className="navbar-actions desktop-only">
            <div className="user-info">
              <FiUser className="user-icon" />
              <span>{user?.full_name || user?.username}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle mobile-only" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <FiHome />
              <span>Dashboard</span>
            </NavLink>
            <NavLink 
              to="/history" 
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <FiClock />
              <span>History</span>
            </NavLink>
            <div className="mobile-user-section">
              <div className="mobile-user-info">
                <FiUser />
                <span>{user?.full_name || user?.username}</span>
              </div>
              <button onClick={handleLogout} className="mobile-logout-btn">
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Ancient Text Translational Portal. Making Sanskrit accessible to everyone.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
