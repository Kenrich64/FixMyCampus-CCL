import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Clock,
  FileText, Camera, Zap, Wifi, Droplets, Home,
  Armchair, Sparkles, AlertTriangle, HelpCircle, Layers
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Classroom equipment', icon: FileText, desc: 'Projectors, smartboards, audio systems' },
  { name: 'Laboratory equipment', icon: Layers, desc: 'Fume hoods, instruments, bench power' },
  { name: 'Electrical problems', icon: Zap, desc: 'Circuit trips, lighting, wiring faults' },
  { name: 'Plumbing and sanitation', icon: Droplets, desc: 'Leaks, washrooms, water supply' },
  { name: 'Hostel maintenance', icon: Home, desc: 'Doors, locks, resident infrastructure' },
  { name: 'Wi-Fi and network connectivity', icon: Wifi, desc: 'Access points, signal drops, ports' },
  { name: 'Furniture damage', icon: Armchair, desc: 'Desks, lecture seating, storage' },
  { name: 'Cleanliness', icon: Sparkles, desc: 'Housekeeping, waste management' },
  { name: 'Safety and infrastructure', icon: AlertTriangle, desc: 'Stairwells, exits, walkways, fire gear' },
  { name: 'Other', icon: HelpCircle, desc: 'General campus facility concerns' }
];

export function LandingPage() {
  return (
    <div style={{ margin: '-2.25rem -1.75rem -2.25rem -1.75rem' }}>

      {/* ─── Hero Section (High-Contrast Charcoal) ─── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="hero-pill-badge">
            <span className="hero-pill-dot" />
            University Complaint Resolution Platform
          </div>

          <h1 className="hero-headline">
            Better campuses start with <em>being heard.</em>
          </h1>

          <p className="hero-statement">
            A transparent management system for university infrastructure.
            Report issues in seconds, track repairs in real-time, and hold campus facilities accountable.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-accent btn-lg">
              Report an Issue <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg" style={{ background: 'transparent', color: 'var(--ivory)', borderColor: 'rgba(250,249,246,0.25)' }}>
              Sign In to Portal
            </Link>
          </div>

          {/* Genuine Product Preview Card */}
          <div className="hero-preview-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span className="table-ref">FC-2026-0042</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--charcoal)' }}>
                  Optics Lab Fume Hood Exhaust Failure
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span className="badge badge-priority-high">High Priority</span>
                <span className="badge badge-in_progress">In Progress</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Location</span>
                <strong style={{ color: 'var(--charcoal)' }}>Physics Block B, Room 204</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</span>
                <strong style={{ color: 'var(--charcoal)' }}>Laboratory equipment</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned Technician</span>
                <strong style={{ color: 'var(--charcoal)' }}>Sunita Verma (HVAC & Mechanical)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Audit Trail</span>
                <span style={{ color: 'var(--accent-green-text)', fontWeight: 600 }}>3 events recorded</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="section-tag">Workflow</span>
            <h2 className="section-title">A direct path from complaint to resolution.</h2>
            <p className="section-desc">
              No lost emails, forgotten slips, or bureaucratic delays. Every report follows a verified, traceable lifecycle.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div>
                <h3>Report a Problem</h3>
                <p>
                  Submit fault details, select the affected campus facility, specify exact location, and attach photo evidence via secure AWS storage.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div>
                <h3>Automated Triage &amp; Dispatch</h3>
                <p>
                  Rule-based classification recommends urgency, queues notifications via SQS, and routes the ticket to the appropriate department lead.
                </p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div>
                <h3>Track &amp; Verify Closure</h3>
                <p>
                  Watch real-time status transitions. Once maintenance completes the repair, resolution notes and timestamps verify the fix.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Complaint Categories ─── */}
      <section className="landing-section" style={{ background: 'var(--ivory)' }}>
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="section-tag">Coverage</span>
            <h2 className="section-title">Everything on campus, covered.</h2>
            <p className="section-desc">
              FixMyCampus handles reports across ten distinct university maintenance domains with specialized technician assignments.
            </p>
          </div>

          <div className="categories-grid">
            {CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="category-chip">
                  <div className="category-icon">
                    <Icon size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{cat.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Why FixMyCampus (Core Pillars) ─── */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="section-tag">Principles</span>
            <h2 className="section-title">Built for institutional trust.</h2>
            <p className="section-desc">
              Engineered with modern cloud standards to provide reliable tracking for thousands of campus residents.
            </p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--paper)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--charcoal)' }}>
                <Clock size={18} />
              </div>
              <h4>Complete Accountability</h4>
              <p>
                Every status update, technician reassignment, and note is written to an append-only audit trail so students and staff remain in lockstep.
              </p>
            </div>

            <div className="pillar-card">
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--paper)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--charcoal)' }}>
                <Camera size={18} />
              </div>
              <h4>Private S3 Evidence</h4>
              <p>
                Photographic evidence is uploaded via signed URLs directly to Amazon S3 with expiring viewing tokens to protect student privacy.
              </p>
            </div>

            <div className="pillar-card">
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--paper)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--charcoal)' }}>
                <ShieldCheck size={18} />
              </div>
              <h4>Role-Based Access Control</h4>
              <p>
                Strict authorization ensures students can only manage their own submissions while facility administrators maintain campus-wide oversight.
              </p>
            </div>
          </div>

          {/* Call to Action Banner */}
          <div className="landing-cta">
            <h2>Ready for a smoother campus experience?</h2>
            <p>
              Submit an infrastructure report in under two minutes or sign in to monitor existing maintenance tickets.
            </p>
            <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-accent btn-lg">
                Create Student Account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg" style={{ background: 'var(--ivory)', color: 'var(--charcoal)', borderColor: 'var(--ivory)' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default LandingPage;
