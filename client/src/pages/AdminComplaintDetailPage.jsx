import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Timeline from '../components/Timeline';
import ConfirmModal from '../components/ConfirmModal';
import {
  ArrowLeft, MapPin, Calendar, User,
  CheckCircle2, Image as ImageIcon, AlertCircle,
  UserCheck, RefreshCw, MessageSquare, Send, AlertTriangle
} from 'lucide-react';

const COMMON_TECHNICIANS = [
  'Vikram Singh (Chief Electrician)',
  'Anita Rao (Network Systems Admin)',
  'Ramesh Patel (Plumbing Lead)',
  'Sunita Verma (HVAC & Mechanical)',
  'David Kumar (Carpentry & Furniture)',
  'Pooja Nair (General Facilities)'
];

export function AdminComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint]       = useState(null);
  const [history, setHistory]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [assignedTo, setAssignedTo]         = useState('');
  const [customTechnician, setCustomTechnician] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote]         = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [priorityNote, setPriorityNote]     = useState('');
  const [noteText, setNoteText]             = useState('');
  const [isResolutionNote, setIsResolutionNote] = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', message: '', confirmAction: null, isDanger: false
  });

  const loadComplaint = async () => {
    try {
      const res = await api.complaints.getById(id);
      if (res.success) {
        setComplaint(res.complaint);
        setHistory(res.history || []);
        setSelectedStatus(res.complaint.status);
        setSelectedPriority(res.complaint.priority);
        setAssignedTo(res.complaint.assigned_to || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load complaint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComplaint(); }, [id]);

  /* ── Action Handlers ── */
  const handleAssign = async (e) => {
    e.preventDefault();
    const finalTech = customTechnician.trim() || assignedTo;
    if (!finalTech) { setError('Please select or specify a maintenance technician.'); return; }
    setSubmitting(true); setError(''); setActionSuccess('');
    try {
      const res = await api.complaints.assign(id, { assignedTo: finalTech, note: 'Assigned for on-site inspection and repair.' });
      if (res.success) {
        setActionSuccess(`Assigned to ${finalTech}. Notification queued via SQS/SNS.`);
        setCustomTechnician('');
        await loadComplaint();
      }
    } catch (err) { setError(err.message || 'Failed to assign technician.'); }
    finally { setSubmitting(false); }
  };

  const executeStatusChange = async () => {
    setSubmitting(true); setError(''); setActionSuccess('');
    try {
      const res = await api.complaints.updateStatus(id, {
        status: selectedStatus,
        note: statusNote || `Status updated to ${selectedStatus}.`
      });
      if (res.success) {
        setActionSuccess(`Status changed to ${selectedStatus.toUpperCase()}.`);
        setStatusNote('');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        await loadComplaint();
      }
    } catch (err) { setError(err.message || 'Failed to update status.'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChangeClick = (e) => {
    e.preventDefault();
    if (selectedStatus === complaint.status) { setError('Status is unchanged.'); return; }
    if (selectedStatus === 'resolved' || selectedStatus === 'rejected') {
      setConfirmModal({
        isOpen: true,
        title: `Confirm: ${selectedStatus.toUpperCase()}`,
        message: selectedStatus === 'resolved'
          ? 'Mark this complaint as Resolved? The student will be notified that the issue has been repaired.'
          : 'Reject this complaint? This closes it without repairs. The student will be notified.',
        confirmAction: executeStatusChange,
        isDanger: selectedStatus === 'rejected'
      });
    } else {
      executeStatusChange();
    }
  };

  const handlePriorityChange = async (e) => {
    e.preventDefault();
    if (selectedPriority === complaint.priority) { setError('Priority is unchanged.'); return; }
    setSubmitting(true); setError(''); setActionSuccess('');
    try {
      const res = await api.complaints.updatePriority(id, {
        priority: selectedPriority,
        note: priorityNote || `Priority adjusted to ${selectedPriority}.`
      });
      if (res.success) {
        setActionSuccess(`Priority updated to ${selectedPriority.toUpperCase()}.`);
        setPriorityNote('');
        await loadComplaint();
      }
    } catch (err) { setError(err.message || 'Failed to update priority.'); }
    finally { setSubmitting(false); }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitting(true); setError(''); setActionSuccess('');
    try {
      const res = await api.complaints.addNote(id, { note: noteText.trim(), isResolutionNote });
      if (res.success) {
        setActionSuccess(isResolutionNote ? 'Resolution note saved — visible to student.' : 'Internal note recorded.');
        setNoteText(''); setIsResolutionNote(false);
        await loadComplaint();
      }
    } catch (err) { setError(err.message || 'Failed to append note.'); }
    finally { setSubmitting(false); }
  };

  /* ── States ── */
  if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading complaint record…</span></div>;
  if (!complaint) return null;

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.125rem' }}>
        <Link
          to="/admin/complaints"
          className="flex-center gap-sm"
          style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', display: 'inline-flex' }}
        >
          <ArrowLeft size={15} /> Back to Complaint List
        </Link>
      </div>

      {/* Feedback alerts */}
      {actionSuccess && (
        <div className="alert alert-success">
          <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Header Card ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="table-ref" style={{ fontSize: '0.9375rem' }}>{complaint.reference_number}</span>
              <span style={{ color: 'var(--border-medium)' }}>·</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{complaint.category}</span>
            </div>
            <h1 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 400, color: 'var(--charcoal)' }}>{complaint.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <div className="meta-row" style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>
          <div className="meta-item">
            <div className="meta-item-label">Location</div>
            <div className="meta-item-value"><MapPin size={13} color="var(--primary)" /> {complaint.location}</div>
          </div>
          <div className="meta-item">
            <div className="meta-item-label">Reported By</div>
            <div className="meta-item-value"><User size={13} /> {complaint.student_name}</div>
          </div>
          <div className="meta-item">
            <div className="meta-item-label">Submitted</div>
            <div className="meta-item-value"><Calendar size={13} /> {new Date(complaint.created_at).toLocaleString()}</div>
          </div>
          {complaint.assigned_to && (
            <div className="meta-item">
              <div className="meta-item-label">Assigned To</div>
              <div className="meta-item-value" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                <UserCheck size={13} /> {complaint.assigned_to}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>

        {/* LEFT: Description, Note form, Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Description + Evidence */}
          <div className="card">
            <h2 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Description & Scope</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {complaint.description}
            </p>
            {complaint.evidence_url && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
                  <ImageIcon size={14} color="var(--primary)" />
                  <h3 style={{ fontSize: '0.875rem' }}>Evidence Photograph (S3 Private Object)</h3>
                </div>
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', maxWidth: '480px', background: 'var(--bg-subtle)' }}>
                  <img
                    src={complaint.evidence_url}
                    alt="Evidence"
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '340px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add Note */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.875rem' }}>
              <MessageSquare size={15} color="var(--primary)" />
              <h2 style={{ fontSize: '0.9375rem' }}>Append Progress Note</h2>
            </div>
            <form onSubmit={handleAddNote}>
              <div className="form-group">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Enter inspection findings, parts replaced, or notes for the student…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={isResolutionNote}
                    onChange={(e) => setIsResolutionNote(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  Mark as student-visible resolution note
                </label>
                <button type="submit" className="btn btn-secondary btn-sm" disabled={submitting || !noteText.trim()}>
                  <Send size={13} /> Append Note
                </button>
              </div>
            </form>
          </div>

          {/* Audit Timeline */}
          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.9375rem' }}>Audit Trail & Event History</h2>
              <p style={{ fontSize: '0.8125rem' }}>
                All changes logged automatically. Status & assignment events trigger SQS/SNS notifications.
              </p>
            </div>
            <Timeline history={history} />
          </div>
        </div>

        {/* RIGHT: Action panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: 'calc(var(--nav-height) + 1rem)' }}>

          {/* Assign Personnel */}
          <div className="action-panel">
            <div className="action-panel-title">
              <UserCheck size={13} /> Assign Personnel
            </div>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label className="form-label">Maintenance Staff</label>
                <select
                  className="form-control"
                  value={assignedTo}
                  onChange={(e) => { setAssignedTo(e.target.value); setCustomTechnician(''); }}
                >
                  <option value="">— Choose technician —</option>
                  {COMMON_TECHNICIANS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Custom Staff Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Doe (External Vendor)"
                  value={customTechnician}
                  onChange={(e) => setCustomTechnician(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={submitting}>
                Update Assignment
              </button>
            </form>
          </div>

          {/* Change Status */}
          <div className="action-panel">
            <div className="action-panel-title">
              <RefreshCw size={13} /> Update Status
            </div>
            <form onSubmit={handleStatusChangeClick}>
              <div className="form-group">
                <label className="form-label">Target Status</label>
                <select
                  className="form-control"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="pending">Pending Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason / Note</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Circuit breaker reset and tested"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                disabled={submitting || selectedStatus === complaint.status}
              >
                Apply Status Change
              </button>
            </form>
          </div>

          {/* Override Priority */}
          <div className="action-panel">
            <div className="action-panel-title">
              <AlertTriangle size={13} /> Override Priority
            </div>
            <form onSubmit={handlePriorityChange}>
              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select
                  className="form-control"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <option value="urgent">Urgent (Safety Hazard)</option>
                  <option value="high">High (Major Disruption)</option>
                  <option value="medium">Medium (Routine)</option>
                  <option value="low">Low (Minor / Cosmetic)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Override Reason</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Exam hall expedited"
                  value={priorityNote}
                  onChange={(e) => setPriorityNote(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                disabled={submitting || selectedPriority === complaint.priority}
              >
                Save Priority
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Confirm Status Change"
        isDanger={confirmModal.isDanger}
        isLoading={submitting}
        onConfirm={confirmModal.confirmAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default AdminComplaintDetailPage;
