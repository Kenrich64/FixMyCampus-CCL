import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import {
  FileText, AlertTriangle, Clock, CheckCircle2,
  TrendingUp, BarChart3, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area
} from 'recharts';

/* ── Custom tooltip for charts ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--ivory)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem',
      boxShadow: 'var(--shadow-sm)', fontSize: '0.8125rem'
    }}>
      <div style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.2rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: 'var(--charcoal)' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  return (
    <div>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-pending" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Facility Operations
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 400 }}>Maintenance Command Center</h1>
          <p>Real-time university maintenance telemetry, intake volume, and automated technician queues.</p>
        </div>
        <Link to="/admin/complaints" className="btn btn-primary">
          <FileText size={15} /> Manage Complaints
        </Link>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Complaints</div>
            <div className="stat-val">{metrics.total}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--paper)', color: 'var(--charcoal)' }}>
            <FileText size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Open / In-Flight</div>
            <div className="stat-val" style={{ color: 'var(--status-pending-text)' }}>{metrics.open}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending-text)' }}>
            <Clock size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">High &amp; Urgent</div>
            <div className="stat-val" style={{ color: 'var(--priority-urgent-text)' }}>{metrics.highPriority}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--priority-urgent-bg)', color: 'var(--priority-urgent-text)' }}>
            <AlertTriangle size={20} />
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

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Avg Resolution</div>
            <div className="stat-val" style={{ color: 'var(--charcoal)', fontSize: metrics.avgResolutionHours > 0 ? '1.5rem' : '1.875rem' }}>
              {metrics.avgResolutionHours > 0 ? `${metrics.avgResolutionHours}h` : '—'}
            </div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--accent-green-soft)', color: 'var(--accent-green-text)' }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>By Infrastructure Category</h2>
              <p style={{ fontSize: '0.8125rem' }}>Distribution of reported campus issues</p>
            </div>
            <BarChart3 size={16} color="var(--charcoal)" />
          </div>
          <div style={{ height: '260px' }}>
            {categoryData.length === 0 ? (
              <div className="empty-state" style={{ height: '100%', padding: '2rem 1rem' }}>
                <p>No category data available yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -24, bottom: 36 }}>
                  <XAxis
                    dataKey="category"
                    angle={-22}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Complaints" fill="var(--charcoal)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Intake Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Complaints Intake Trend</h2>
              <p style={{ fontSize: '0.8125rem' }}>Daily submission volume over time</p>
            </div>
            <TrendingUp size={16} color="var(--accent-green-text)" />
          </div>
          <div style={{ height: '260px' }}>
            {trendData.length === 0 ? (
              <div className="empty-state" style={{ height: '100%', padding: '2rem 1rem' }}>
                <p>No trend data recorded yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#66C98B" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#66C98B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="complaints"
                    name="Complaints"
                    stroke="#66C98B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#areaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Complaints ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Campus Submissions</h2>
            <p style={{ fontSize: '0.8125rem' }}>Latest items requiring review or department dispatch</p>
          </div>
          <Link to="/admin/complaints" className="btn btn-secondary btn-sm">
            View All Complaints <ArrowRight size={13} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <p>No complaints in the system yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Student</th>
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
                    <td style={{ fontWeight: 500, maxWidth: '240px' }}>
                      <div className="truncate">{c.title}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{c.category}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {c.student_name || 'Anonymous'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.location}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link to={`/admin/complaints/${c.id}`} className="btn btn-secondary btn-xs">Manage</Link>
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

export default AdminDashboardPage;
