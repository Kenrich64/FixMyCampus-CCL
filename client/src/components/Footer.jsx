import React from 'react';
import { Server, Database, Cloud, ShieldCheck, Bell, Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">FixMyCampus</div>
          <div className="footer-copy">
            University Facilities &amp; Maintenance Management &mdash; Academic Cloud Infrastructure Project &copy; {new Date().getFullYear()}
          </div>
        </div>

        <div className="footer-badges">
          <span className="footer-badge"><Server size={11} color="var(--charcoal)" /> AWS EC2</span>
          <span className="footer-badge"><Database size={11} color="var(--charcoal)" /> RDS PostgreSQL</span>
          <span className="footer-badge"><Cloud size={11} color="var(--accent-green-text)" /> S3 Private Buckets</span>
          <span className="footer-badge"><Bell size={11} color="var(--charcoal)" /> SQS &amp; SNS</span>
          <span className="footer-badge"><ShieldCheck size={11} color="var(--charcoal)" /> IAM Policies</span>
          <span className="footer-badge"><Activity size={11} color="var(--charcoal)" /> CloudWatch Metrics</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
