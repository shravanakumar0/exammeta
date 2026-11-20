import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaGraduationCap, FaGoogle, FaGithub, FaArrowRight } from 'react-icons/fa';
import { supabase, signUp, signIn, signOut, onAuthStateChange } from '../supabaseClient';
import './LoginPage.css';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

  // Check if env variables are configured
  const isEnvConfigured = Boolean(
    process.env.REACT_APP_SUPABASE_URL &&
    process.env.REACT_APP_SUPABASE_ANON_KEY
  );

  // Check auth state on mount
  useEffect(() => {
    if (!isEnvConfigured) {
      setError('Supabase is not configured. Please check your .env file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
      return;
    }

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, isEnvConfigured]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isEnvConfigured) {
      setError('Supabase environment variables are missing. Check your .env file.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;
        setError('Account created successfully! Please check your email to confirm your account.');
      }
    } catch (err) {
      let message = err.message;
      if (err.message === 'Failed to fetch') {
        message = 'Cannot connect to Supabase. Please check:\n1. Your internet connection\n2. Supabase project is active\n3. CORS allows http://localhost:3000\n4. .env file has correct SUPABASE_URL and SUPABASE_ANON_KEY';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider) => {
    setLoading(true);
    setError('');

    if (!isEnvConfigured) {
      setError('Supabase environment variables are missing.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err) {
      let message = err.message;
      if (err.message === 'Failed to fetch') {
        message = 'Cannot connect to Supabase. Check your .env and CORS settings.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isEnvConfigured) {
    return (
      <div className="login-page">
        <div className="login-background">
          <div className="login-shape shape-1"></div>
          <div className="login-shape shape-2"></div>
          <div className="login-shape shape-3"></div>
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">
                <FaGraduationCap size={40} className="logo-icon" />
                <h1>Exam<span className="text-gradient">Meta</span></h1>
              </div>
              <h2>Configuration Required</h2>
            </div>
            <div className="login-error">
              <p><strong>Missing Supabase Configuration:</strong></p>
              <p>Please create a <code>.env</code> file in <code>exammeta/</code> with:</p>
              <div className="env-example">
                REACT_APP_SUPABASE_URL=your_supabase_project_url<br />
                REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
              </div>
              <p>Then restart the dev server with <code>npm start</code>.</p>
            </div>
            <div className="login-footer">
              <Link to="/" className="toggle-link">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-shape shape-1"></div>
        <div className="login-shape shape-2"></div>
        <div className="login-shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <FaGraduationCap size={40} className="logo-icon" />
              <h1>Exam<span className="text-gradient">Meta</span></h1>
            </div>
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Sign in to access your VTU study resources' : 'Join thousands of VTU students today'}</p>
          </div>

          {error && (
            <div className="login-error">
              <FaLock size={16} /> {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <FaUser className="form-icon" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="form-group">
              <FaEnvelope className="form-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <FaLock className="form-icon" />
              <input
                type="password"
                name={isLogin ? 'password' : 'password'}
                placeholder={isLogin ? 'Password' : 'Create Password'}
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>
            {!isLogin && (
              <div className="form-group">
                <FaLock className="form-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'} <FaArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>Or continue with</span>
          </div>

          <div className="social-login">
            <button
              className="social-btn google-btn"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
            >
              <FaGoogle className="social-icon" /> Google
            </button>
            <button
              className="social-btn github-btn"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
            >
              <FaGithub className="social-icon" /> GitHub
            </button>
          </div>

          <div className="login-footer">
            {isLogin
              ? `Don't have an account? `
              : 'Already have an account? '}
            <button
              type="button"
              className="toggle-link"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
