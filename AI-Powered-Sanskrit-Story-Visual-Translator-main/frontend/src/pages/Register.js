import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiBook, FiCheck, FiX } from 'react-icons/fi';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength requirements
  const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'One number', test: (p) => /\d/.test(p) },
    { id: 'special', label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const checkPasswordStrength = () => {
    return passwordRequirements.filter((req) => req.test(formData.password)).length;
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (checkPasswordStrength() < 5) {
      newErrors.password = 'Password does not meet all requirements';
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card register-card">
          {/* Logo and Title */}
          <div className="auth-header">
            <div className="auth-logo">
              <FiBook />
            </div>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">
              Join the Ancient Text Translational Portal
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="username" className="input-label">
                  Username *
                </label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`input-field with-icon ${errors.username ? 'error' : ''}`}
                    placeholder="Choose a username"
                    autoComplete="username"
                  />
                </div>
                {errors.username && <span className="input-error">{errors.username}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="full_name" className="input-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="input-field with-icon"
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email *
              </label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field with-icon ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="input-error">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password *
              </label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field with-icon ${errors.password ? 'error' : ''}`}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <span className="input-error">{errors.password}</span>}

              {/* Password Requirements */}
              {formData.password && (
                <div className="password-requirements">
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.id}
                      className={`requirement ${req.test(formData.password) ? 'met' : ''}`}
                    >
                      {req.test(formData.password) ? <FiCheck /> : <FiX />}
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="confirm_password" className="input-label">
                Confirm Password *
              </label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`input-field with-icon ${errors.confirm_password ? 'error' : ''}`}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirm_password && (
                <span className="input-error">{errors.confirm_password}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative Side */}
        <div className="auth-decoration">
          <div className="decoration-content">
            <h2>Ancient Text Translational Portal</h2>
            <p>
              Join thousands of scholars and enthusiasts in exploring the rich
              heritage of Sanskrit literature through modern technology.
            </p>
            <div className="decoration-features">
              <div className="feature">
                <span className="feature-icon">🔒</span>
                <span>Secure Authentication</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <span>Access Anywhere</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💾</span>
                <span>Save Translations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
