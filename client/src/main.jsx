import React, { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FixMyCampus App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F2F0EB',
          padding: '2rem 1rem',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FAF9F6',
            border: '1px solid #DAD8D2',
            borderRadius: '8px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 14px rgba(38,38,41,0.06)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              background: '#262629',
              color: '#FAF9F6',
              fontFamily: "'Instrument Serif', serif",
              fontSize: '1.4rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              F
            </div>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: '1.85rem',
              color: '#262629',
              fontWeight: 400,
              marginBottom: '0.5rem'
            }}>
              Application Notice
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#777773', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              The application encountered a client session issue. Please reload the portal or clear temporary cache.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  localStorage.removeItem('fixmycampus_token');
                  window.location.href = '/';
                }}
                style={{
                  background: '#262629',
                  color: '#FAF9F6',
                  border: 'none',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '5px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Reset Session &amp; Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
