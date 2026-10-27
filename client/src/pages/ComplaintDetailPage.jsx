import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Timeline from '../components/Timeline';
import {
  ArrowLeft, MapPin, Calendar, User,
  CheckCircle2, Image as ImageIcon, AlertCircle
} from 'lucide-react';

export function ComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.complaints.getById(id);
        if (res.success) {
          setComplaint(res.complaint);
          setHistory(res.history || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load complaint details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading complaint record…</span></div>;

  if (error || !complaint) {
    return (
      <div className="card" style={{ maxWidth: '560px', margin: '3rem auto', padding: '2.5rem' }}>
        <div className="empty-state">
          <div className="empty-state-icon" style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)' }}>
            <AlertCircle size={22} />
          </div>
          <h3>Unable to Load Complaint</h3>
          <p>{error || 'The complaint does not exist or you lack permission to view it.'}</p>
          <Link to="/complaints" className="btn btn-primary btn-sm">
            <ArrowLeft size={14} /> Back to Complaints
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>

      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/complaints"
          className="flex-center gap-sm"
          style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'inline-flex' }}
        >
          <ArrowLeft size={14} /> Back to My Complaints
        </Link>
      </div>

      {/* ── Header Card ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="table-ref">{complaint.reference_number}</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{complaint.category}</span>
            </div>
            <h1 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 400, color: 'var(--charcoal)' }}>
              {complaint.title}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        {/* Metadata strip */}
        <div className="meta-row" style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>
          <div className="meta-item">
            <div className="meta-item-label">Location</div>
            <div className="meta-item-value"><MapPin size={13} color="var(--charcoal)" /> {complaint.location}</div>
          </div>
          <div className="meta-item">
            <div className="meta-item-label">Reported</div>
            <div className="meta-item-value"><Calendar size={13} /> {new Date(complaint.created_at).toLocaleString()}</div>
          </div>
          {complaint.assigned_to && (
            <div className="meta-item">
              <div className="meta-item-label">Assigned Technician</div>
              <div className="meta-item-value" style={{ color: 'var(--accent-green-text)', fontWeight: 600 }}>
                <User size={13} /> {complaint.assigned_to}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>

        {/* ── Description & Evidence ── */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Detailed Report</h2>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9375rem' }}>
            {complaint.description}
          </p>

          {/* Resolution banner */}
          {complaint.status === 'resolved' && (
            <div className="alert alert-success" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Verified &amp; Resolved</div>
                <div style={{ fontSize: '0.8125rem' }}>
                  {complaint.resolution_note || 'Maintenance personnel verified repairs and closed this complaint.'}
                  {complaint.resolved_at && (
                    <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>
                      · Closed {new Date(complaint.resolved_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Evidence photo */}
          {complaint.evidence_url && (
            <div style={{ marginTop: '1.375rem', paddingTop: '1.375rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <ImageIcon size={15} color="var(--charcoal)" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Attached Photographic Evidence</h3>
              </div>
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: '440px', background: 'var(--paper)' }}>
                <img
                  src={complaint.evidence_url}
                  alt="Evidence photograph"
                  style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '360px', objectFit: 'contain' }}
                />
              </div>
              <div style={{ marginTop: '0.375rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Protected via Amazon S3 presigned URL (temporary access token)
              </div>
            </div>
          )}
        </div>

        {/* ── Audit Timeline ── */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Complaint History &amp; Audit Trail</h2>
            <p style={{ fontSize: '0.8125rem' }}>Immutable chronological record of all facilities updates</p>
          </div>
          <Timeline history={history} />
        </div>
      </div>
    </div>
  );
}

export default ComplaintDetailPage;
