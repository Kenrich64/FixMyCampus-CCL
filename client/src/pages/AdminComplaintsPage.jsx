import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { Search, MapPin, ArrowRight, RefreshCw, FileSpreadsheet } from 'lucide-react';

const CATEGORIES = [
  'Classroom equipment', 'Laboratory equipment', 'Electrical problems',
  'Plumbing and sanitation', 'Hostel maintenance', 'Wi-Fi and network connectivity',
  'Furniture damage', 'Cleanliness', 'Safety and infrastructure', 'Other'
];

export function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaints = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await api.complaints.list(params);
      if (res.success) {
        setComplaints(res.complaints || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(1); }, [status, priority, category]);
  const handleSearch = (e) => { e.preventDefault(); fetchComplaints(1); };
  const resetFilters = () => { setStatus(''); setPriority(''); setCategory(''); setSearch(''); };

  return (
    <div>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-title">
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 400 }}>Complaint Management</h1>
          <p>Filter, prioritize, assign technicians, and record official resolution updates.</p>
        </div>
        <button onClick={() => fetchComplaints(pagination.page)} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} /> Refresh List
        </button>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search title, ref # (e.g. FC-2026-0001), or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={resetFilters} className="btn btn-ghost btn-sm">Reset</button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={13} /> Filter Records
            </button>
          </div>
        </form>
      </div>

      {/* ── Table / States ── */}
      {loading ? (
        <div className="loading-state"><div className="spinner" /><span>Filtering records…</span></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : complaints.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileSpreadsheet size={22} /></div>
            <h3>No complaints match your filters</h3>
            <p>Try adjusting your search criteria or resetting the filters.</p>
            <button onClick={resetFilters} className="btn btn-primary btn-sm">Reset Filters</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Student</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((comp) => (
                  <tr key={comp.id}>
                    <td><span className="table-ref">{comp.reference_number}</span></td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ fontWeight: 500 }} className="truncate">{comp.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="truncate">{comp.description}</div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{comp.category}</td>
                    <td>
                      <span className="flex-center gap-sm" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={11} color="var(--charcoal)" /> {comp.location}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{comp.student_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{comp.student_email}</div>
                    </td>
                    <td>
                      {comp.assigned_to ? (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--accent-green-text)', fontWeight: 600 }}>{comp.assigned_to}</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td><PriorityBadge priority={comp.priority} /></td>
                    <td><StatusBadge status={comp.status} /></td>
                    <td className="text-right">
                      <Link to={`/admin/complaints/${comp.id}`} className="btn btn-primary btn-xs">
                        Manage <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.8125rem', color: 'var(--text-secondary)'
          }}>
            <span>Showing {complaints.length} of {pagination.total} records</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <button
                className="btn btn-secondary btn-xs"
                disabled={pagination.page <= 1}
                onClick={() => fetchComplaints(pagination.page - 1)}
              >
                ← Prev
              </button>
              <span style={{ padding: '0 0.375rem' }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary btn-xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchComplaints(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComplaintsPage;
