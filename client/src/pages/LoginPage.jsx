import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const dest = location.state?.from?.pathname || (user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoStudent = () => { setEmail('student@fixmycampus.edu'); setPassword('StudentPass123!'); setError(''); };
  const fillDemoAdmin   = () => { setEmail('admin@fixmycampus.edu');   setPassword('AdminSecureCampus2026!'); setError(''); };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-mark">
            F
          </div>
          <h1>Sign in to FixMyCampus</h1>
          <p>Campus Infrastructure &amp; Maintenance Management</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Campus Email</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="you@fixmycampus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Authenticating…</>
            ) : (
              <><LogIn size={15} /> Sign In</>
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="auth-divider">Demo Accounts</div>
        <div className="demo-grid">
          <button
            id="quick-demo-student-btn"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fillDemoStudent}
          >
            <UserCheck size={13} color="var(--charcoal)" /> Student Demo
          </button>
          <button
            id="quick-demo-admin-btn"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fillDemoAdmin}
          >
            <ShieldCheck size={13} color="#7C5815" /> Facility Admin
          </button>
        </div>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Register as Student</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
