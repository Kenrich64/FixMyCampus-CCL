import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { PlusCircle, Clock, PlayCircle, CheckCircle2, FileText, ArrowRight, MapPin, AlertCircle } from 'lucide-react';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.dashboard.getStudent();
        if (res.success) setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading dashboard records…</span>
      </div>
    );
  }

  const metrics = data?.metrics || { total: 0, pending: 0, inProgress: 0, resolved: 0 };
  const recent  = data?.recentComplaints || [];

  return (
    <div>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-title">
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 400 }}>
            Welcome, {user?.name}
          </h1>
          <p>Track your submitted campus maintenance requests and report new facility issues.</p>
        </div>
        <Link id="student-report-btn" to="/complaints/new" className="btn btn-primary">
          <PlusCircle size={15} /> Report an Issue
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Reported</div>
            <div className="stat-val">{metrics.total}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--paper)', color: 'var(--charcoal)' }}>
            <FileText size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Under Review</div>
            <div className="stat-val" style={{ color: 'var(--status-pending-text)' }}>{metrics.pending}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending-text)' }}>
            <Clock size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">In Progress</div>
            <div className="stat-val" style={{ color: 'var(--status-in-progress-text)' }}>{metrics.inProgress}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--status-in-progress-bg)', color: 'var(--status-in-progress-text)' }}>
            <PlayCircle size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Resolved</div>
            <div className="stat-val" style={{ color: 'var(--status-resolved-text)' }}>{metrics.resolved}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--status-resolved-bg)', color: 'var(--status-resolved-text)' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* ── Recent Complaints ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1.05rem' }}>Recent Complaints</h2>
            <p style={{ fontSize: '0.8125rem' }}>Your latest reported infrastructure issues</p>
          </div>
          <Link to="/complaints" className="btn btn-secondary btn-sm">
            View All ({metrics.total}) <ArrowRight size={13} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={22} /></div>
            <h3>No complaints filed yet</h3>
            <p>Notice a broken light, leaking pipe, or equipment failure? Submit a report and track it until it is resolved.</p>
            <Link to="/complaints/new" className="btn btn-primary btn-sm">
              <PlusCircle size={14} /> File Your First Complaint
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id}>
                    <td><span className="table-ref">{c.reference_number}</span></td>
                    <td style={{ fontWeight: 500, maxWidth: '260px' }}>
                      <div className="truncate">{c.title}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{c.category}</td>
                    <td>
                      <span className="flex-center gap-sm" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={12} /> {c.location}
                      </span>
                    </td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link to={`/complaints/${c.id}`} className="btn btn-secondary btn-xs">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboardPage;
