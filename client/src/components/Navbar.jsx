import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, LayoutDashboard, ListFilter, LogOut, Shield } from 'lucide-react';

export function Navbar() {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isStartsWith = (prefix) => location.pathname.startsWith(prefix);

  return (
    <header className="navbar">
      <div className="navbar-inner">

        {/* ── Brand ── */}
        <Link
          to={isAdmin ? '/admin/dashboard' : (user ? '/dashboard' : '/')}
          className="navbar-brand"
        >
          <div className="navbar-mark">
            F
          </div>
          <div>
            <span className="navbar-brand-name">FixMyCampus</span>
          </div>
        </Link>

        {/* ── Navigation ── */}
        <nav className="navbar-nav">
          {user ? (
            <>
              {isStudent && (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-link${isActive('/dashboard') ? ' active' : ''}`}
                  >
                    <LayoutDashboard size={14} />
                    Dashboard
                  </Link>
                  <Link
                    to="/complaints/new"
                    className={`nav-link${isActive('/complaints/new') ? ' active' : ''}`}
                  >
                    <PlusCircle size={14} />
                    Report Issue
                  </Link>
                  <Link
                    to="/complaints"
                    className={`nav-link${isActive('/complaints') ? ' active' : ''}`}
                  >
                    <ListFilter size={14} />
                    My Complaints
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`nav-link${isActive('/admin/dashboard') ? ' active' : ''}`}
                  >
                    <LayoutDashboard size={14} />
                    Overview
                  </Link>
                  <Link
                    to="/admin/complaints"
                    className={`nav-link${isStartsWith('/admin/complaints') ? ' active' : ''}`}
                  >
                    <ListFilter size={14} />
                    Manage All
                  </Link>
                </>
              )}

              {/* ── User pill ── */}
              <div className="navbar-user-sep" />
              <div className="navbar-user">
                <div className="navbar-user-info">
                  <div className="navbar-user-name">{user.name}</div>
                  <div
                    className="navbar-user-role"
                    style={{ color: isAdmin ? '#8F4F18' : 'var(--accent-green-text)' }}
                  >
                    {user.role === 'admin' ? 'Facility Admin' : 'Student'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                  title="Sign out"
                  style={{ color: 'var(--status-rejected-text)', padding: '0.35rem' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Report an Issue</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
