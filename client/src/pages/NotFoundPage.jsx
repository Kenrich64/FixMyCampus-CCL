import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Compass, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage({ isUnauthorized = false }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isAccessDenied = isUnauthorized || location.pathname === '/unauthorized';

  return (
    <div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '3rem 2.25rem' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: 'var(--radius-sm)',
          background: isAccessDenied ? 'var(--status-rejected-bg)' : 'var(--paper)',
          border: '1px solid var(--border)',
          color: isAccessDenied ? 'var(--status-rejected-text)' : 'var(--charcoal)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          {isAccessDenied ? <ShieldAlert size={24} /> : <Compass size={24} />}
        </div>

        <h1 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 400, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
          {isAccessDenied ? 'Access Restricted' : 'Page Not Found'}
        </h1>

        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.875rem', color: 'var(--text-secondary)' }}>
          {isAccessDenied
            ? 'You do not have administrative privileges to access this area. Student sessions cannot view administrator tools.'
            : 'The resource you requested could not be located on the FixMyCampus portal. Please return to the homepage.'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.625rem' }}>
          {user ? (
            <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="btn btn-primary btn-sm">
              <Home size={14} /> Return to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </Link>
          ) : (
            <Link to="/" className="btn btn-primary btn-sm">
              <ArrowLeft size={14} /> Return to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
