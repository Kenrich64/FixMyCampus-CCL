import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import {
  PlusCircle, Upload, AlertTriangle, Lightbulb,
  CheckCircle2, Image as ImageIcon, X, FileText
} from 'lucide-react';

const CATEGORIES = [
  'Classroom equipment',
  'Laboratory equipment',
  'Electrical problems',
  'Plumbing and sanitation',
  'Hostel maintenance',
  'Wi-Fi and network connectivity',
  'Furniture damage',
  'Cleanliness',
  'Safety and infrastructure',
  'Other'
];

export function NewComplaintPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [recommendation, setRecommendation] = useState({
    recommendedPriority: 'medium',
    reason: 'Evaluating campus maintenance rules…',
    matchedRules: []
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /* Live priority recommendation */
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.complaints.recommendPriority({ category, title, description });
        if (res.success) {
          setRecommendation({
            recommendedPriority: res.recommendedPriority,
            reason: res.reason,
            matchedRules: res.matchedRules || []
          });
        }
      } catch (_) { /* silent fallback */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [category, title, description]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Evidence photo must be under 5MB.');
      return;
    }
    setError('');
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (title.trim().length < 5)       { setError('Title must be at least 5 characters.'); return; }
    if (description.trim().length < 10) { setError('Description must be at least 10 characters.'); return; }
    if (location.trim().length < 3)     { setError('Please provide a specific campus location.'); return; }

    setLoading(true);
    try {
      setUploadProgress('Submitting complaint to database…');
      const compRes = await api.complaints.create({ title, description, category, location, priority: recommendation.recommendedPriority });
      const newComplaint = compRes.complaint;

      if (selectedFile && newComplaint?.id) {
        setUploadProgress('Requesting S3 presigned upload URL…');
        const presigned = await api.uploads.getPresignedUrl({ fileType: selectedFile.type, fileSize: selectedFile.size });
        setUploadProgress('Uploading evidence to Amazon S3…');
        await api.uploads.uploadToS3(presigned.uploadUrl, selectedFile, selectedFile.type);
        setUploadProgress('Confirming S3 upload & recording audit history…');
        await api.uploads.confirm({ complaintId: newComplaint.id, s3Key: presigned.s3Key });
      }

      setUploadProgress('Complaint registered! Redirecting…');
      setTimeout(() => navigate(`/complaints/${newComplaint.id}`), 500);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint.');
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-title">
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 400 }}>Report a Campus Issue</h1>
          <p>Provide specific details and optional photo evidence to expedite facilities resolution.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
      {uploadProgress && (
        <div className="alert alert-info">
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{uploadProgress}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Issue Details ── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FileText size={16} color="var(--charcoal)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Issue Overview</h2>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="complaint-title">Complaint Title *</label>
            <input
              id="complaint-title"
              type="text"
              className="form-control"
              placeholder="e.g. Broken bench wiring sparking near Physics Lab, workbench 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="complaint-category">Category *</label>
              <select
                id="complaint-category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="complaint-location">Location / Room *</label>
              <input
                id="complaint-location"
                type="text"
                className="form-control"
                placeholder="e.g. Science Block B, Room 204"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <label className="form-label" htmlFor="complaint-description">Detailed Description *</label>
            <textarea
              id="complaint-description"
              className="form-control"
              rows={4}
              placeholder="Describe the issue, exact room position, and any immediate hazards…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
        </div>

        {/* ── Smart Priority Recommendation ── */}
        <div className="card" style={{ background: 'var(--paper)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lightbulb size={16} color="var(--charcoal)" />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--charcoal)' }}>
                Rule-Based Priority Scoring
              </span>
            </div>
            <PriorityBadge priority={recommendation.recommendedPriority} />
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {recommendation.reason}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
            ℹ Facility supervisors verify and adjust priority upon technician dispatch.
          </p>
        </div>

        {/* ── Evidence Upload ── */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <Upload size={16} color="var(--charcoal)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Photographic Evidence <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span></h2>
          </div>
          <p style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
            Stored securely in private Amazon S3 with short-lived presigned viewing credentials.
          </p>

          {filePreview ? (
            <div style={{ position: 'relative', display: 'inline-block', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: '280px' }}>
              <img src={filePreview} alt="Evidence preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
              <button
                type="button"
                onClick={removeFile}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: 'rgba(38,38,41,0.85)', color: '#fff',
                  border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="upload-dropzone">
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-xs)', background: 'var(--ivory)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--charcoal)', marginBottom: '0.625rem' }}>
                <ImageIcon size={18} />
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--charcoal)' }}>
                Click to attach evidence photo
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                PNG, JPG or WEBP · up to 5 MB
              </div>
              <input
                id="complaint-evidence-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            id="submit-complaint-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Registering…</>
            ) : (
              <><PlusCircle size={15} /> Submit Complaint</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewComplaintPage;
