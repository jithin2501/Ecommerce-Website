
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../SEO';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/client-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('clientToken', data.token);
        localStorage.setItem('clientUser', JSON.stringify(data.user));
        window.dispatchEvent(new Event('client_user_updated'));
        navigate('/');
      } else {
        setMessage({ text: data.error || 'Login failed', type: 'error' });
      }
    } catch (err) {
      console.error("❌ Login FAILED:", err);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setMessage({ text: 'Google Login is disabled. Please use Email/Password.', type: 'error' });
  };

  return (
    <div className="ul-page">
      <SEO 
        title="Login" 
        description="Login to your Sumathi Trends account to manage your orders, addresses, and wishlist."
      />

      <div className="ul-container">

        <div className="ul-image-section">
          <button className="ul-back-btn" onClick={() => navigate('/')} title="Back to Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <img
            src="/images/login/client_login.png"
            alt="Login Illustration"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <div className="ul-form-section">

          {message.text && (
            <div className={`ul-message ${message.type === 'success' ? 'ul-msg-success' : 'ul-msg-error'}`}>
              {message.text}
            </div>
          )}

          <div className="ul-header">
            <h1>Welcome back</h1>
            <p>Please log into your account</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="ul-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="ul-form-group">
              <label htmlFor="password">Password</label>
              <div className="ul-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="ul-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="ul-btn-signin"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="ul-footer">
            Don't have an account? <span className="ul-link" onClick={() => navigate('/signup')}>Sign Up</span>
          </div>

        </div>
      </div>
    </div>
  );
}