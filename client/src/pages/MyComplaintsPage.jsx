import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { Search, PlusCircle, FileText, MapPin, Calendar, ArrowRight } from 'lucide-react';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
];

export function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.complaints.list(params);
      if (res.success) setComplaints(res.complaints || []);
    } catch (err) {
      setError(err.message || 'Failed to load your complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [statusFilter]);
  const handleSearchSubmit = (e) => { e.preventDefault(); fetchComplaints(); };

  return (
    <div>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-title">
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 400 }}>My Complaints</h1>
          <p>Review status updates and resolution progress for all your reported issues.</p>
        </div>
        <Link to="/complaints/new" className="btn btn-primary">
          <PlusCircle size={15} /> Report New Issue
        </Link>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.875rem 1.125rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`btn btn-sm ${statusFilter === tab.value ? 'btn-primary' : 'btn-secondary'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '340px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search title, ref #, location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.125rem' }}
              />
              <Search size={14} color="var(--text-light)" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">Search</button>
          </form>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="loading-state"><div className="spinner" /><span>Loading complaints…</span></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : complaints.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={22} /></div>
            <h3>No matching complaints</h3>
            <p>{statusFilter || search ? 'Try resetting filters or different search terms.' : 'You have not submitted any complaints yet.'}</p>
            <Link to="/complaints/new" className="btn btn-primary btn-sm">
              <PlusCircle size={14} /> File an Issue
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {complaints.map((comp) => (
            <div key={comp.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.625rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                    <span className="table-ref">{comp.reference_number}</span>
                    <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>·</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{comp.category}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{comp.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <PriorityBadge priority={comp.priority} />
                  <StatusBadge status={comp.status} />
                </div>
              </div>

              <p style={{
                fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.875rem',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {comp.description}
              </p>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '0.625rem',
                paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.8125rem', color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span className="flex-center gap-sm"><MapPin size={12} color="var(--charcoal)" /> {comp.location}</span>
                  <span className="flex-center gap-sm"><Calendar size={12} /> {new Date(comp.created_at).toLocaleDateString()}</span>
                  {comp.assigned_to && (
                    <span style={{ color: 'var(--accent-green-text)', fontWeight: 600 }}>Assigned: {comp.assigned_to}</span>
                  )}
                </div>
                <Link to={`/complaints/${comp.id}`} className="btn btn-secondary btn-xs">
                  View Details <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyComplaintsPage;
