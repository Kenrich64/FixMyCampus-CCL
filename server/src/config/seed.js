import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool, query, withTransaction, initDbPool } from './db.js';
import { loadParameterStoreConfig } from '../services/ssmService.js';

dotenv.config();

async function seedDevelopmentData() {
  if (process.env.USE_AWS_SERVICES === 'true') {
    await loadParameterStoreConfig();
    initDbPool();
  }

  console.log('----------------------------------------------------');
  console.log('🌱 Seeding FixMyCampus Realistic Development Data...');
  console.log('NOTE: All generated records are clearly marked as [DEMO DATA]');
  console.log('----------------------------------------------------');

  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_SEED) {
    console.error('⛔ Refusing to seed demo data into production database.');
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash('StudentPass123!', 10);
    const adminPasswordHash = await bcrypt.hash('AdminSecureCampus2026!', 10);

    // 1. Seed Users
    const usersToSeed = [
      { name: 'Dr. Sarah Jenkins (Campus Admin)', email: 'admin@fixmycampus.edu', role: 'admin', hash: adminPasswordHash },
      { name: 'Arjun Verma [Demo Student]', email: 'student@fixmycampus.edu', role: 'student', hash: passwordHash },
      { name: 'Priya Sharma [Demo Student]', email: 'priya.sharma@fixmycampus.edu', role: 'student', hash: passwordHash },
      { name: 'Rahul Nair [Demo Student]', email: 'rahul.nair@fixmycampus.edu', role: 'student', hash: passwordHash }
    ];

    const userMap = {};

    for (const u of usersToSeed) {
      const res = await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, email, role;`,
        [u.name, u.email, u.hash, u.role]
      );
      userMap[u.email] = res.rows[0].id;
      console.log(`👤 User ready: ${u.email} (ID: ${res.rows[0].id})`);
    }

    const adminId = userMap['admin@fixmycampus.edu'];
    const arjunId = userMap['student@fixmycampus.edu'];
    const priyaId = userMap['priya.sharma@fixmycampus.edu'];
    const rahulId = userMap['rahul.nair@fixmycampus.edu'];

    // 2. Sample Complaints across categories and statuses
    const demoComplaints = [
      {
        ref: 'FC-2026-0001',
        title: '[DEMO DATA] Sparking Power Outlet in Physics Lab 2',
        desc: 'The wall socket on workbench 4 emits visible electrical sparks and a burning smell when power is turned on.',
        cat: 'Electrical problems',
        loc: 'Science Block B, Room 204 (Physics Lab 2)',
        pri: 'urgent',
        status: 'in_progress',
        studentId: arjunId,
        assignedTo: 'Vikram Singh (Chief Electrician)',
        hist: [
          { type: 'submitted', note: 'Complaint submitted by student with urgent safety hazard details.', by: arjunId, byName: 'Arjun Verma [Demo Student]' },
          { type: 'priority_changed', old: 'high', new: 'urgent', note: 'Priority escalated to Urgent due to electrical fire hazard rules.', by: adminId, byName: 'Dr. Sarah Jenkins' },
          { type: 'assigned', new: 'Vikram Singh (Chief Electrician)', note: 'Assigned to senior electrical maintenance squad.', by: adminId, byName: 'Dr. Sarah Jenkins' },
          { type: 'status_changed', old: 'pending', new: 'in_progress', note: 'Electrician on site isolating the circuit breaker.', by: adminId, byName: 'Dr. Sarah Jenkins' }
        ]
      },
      {
        ref: 'FC-2026-0002',
        title: '[DEMO DATA] High-Definition Projector HDMI Port Broken in Auditorium 1',
        desc: 'Ceiling projector HDMI input is physically damaged. Lectures cannot display slide presentations.',
        cat: 'Classroom equipment',
        loc: 'Main Academic Block, Central Auditorium',
        pri: 'medium',
        status: 'pending',
        studentId: priyaId,
        assignedTo: null,
        hist: [
          { type: 'submitted', note: 'Complaint logged before scheduled guest lecture.', by: priyaId, byName: 'Priya Sharma [Demo Student]' }
        ]
      },
      {
        ref: 'FC-2026-0003',
        title: '[DEMO DATA] Water Pipe Leakage in Hostel 3 Ground Floor Washroom',
        desc: 'Continuous leakage from the main inlet valve causing water pooling on the corridor floor.',
        cat: 'Plumbing and sanitation',
        loc: 'Hostel Block 3, Ground Floor West Wing',
        pri: 'high',
        status: 'resolved',
        studentId: rahulId,
        assignedTo: 'Ramesh Patel (Plumbing Lead)',
        resNote: 'Replaced cracked brass coupling valve and resealed fitting. Inspected area and verified dry floor.',
        resolvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        hist: [
          { type: 'submitted', note: 'Urgent plumbing assistance requested.', by: rahulId, byName: 'Rahul Nair [Demo Student]' },
          { type: 'assigned', new: 'Ramesh Patel (Plumbing Lead)', note: 'Dispatched maintenance technician.', by: adminId, byName: 'Dr. Sarah Jenkins' },
          { type: 'status_changed', old: 'pending', new: 'in_progress', note: 'Work commenced.', by: adminId, byName: 'Dr. Sarah Jenkins' },
          { type: 'status_changed', old: 'in_progress', new: 'resolved', note: 'Valve replaced, water flow restored and verified.', by: adminId, byName: 'Dr. Sarah Jenkins' }
        ]
      },
      {
        ref: 'FC-2026-0004',
        title: '[DEMO DATA] Wi-Fi Access Point Dropping Connections in Central Library',
        desc: 'AP-LIB-04 disconnects students every 2-3 minutes. Signal strength drops to 0.',
        cat: 'Wi-Fi and network connectivity',
        loc: 'Central Library, 2nd Floor Reading Hall',
        pri: 'medium',
        status: 'in_progress',
        studentId: arjunId,
        assignedTo: 'Anita Rao (Network Admin)',
        hist: [
          { type: 'submitted', note: 'Reported during exam preparation period.', by: arjunId, byName: 'Arjun Verma [Demo Student]' },
          { type: 'assigned', new: 'Anita Rao (Network Admin)', note: 'Referred to campus IT network team.', by: adminId, byName: 'Dr. Sarah Jenkins' },
          { type: 'status_changed', old: 'pending', new: 'in_progress', note: 'Firmware reset and channel reconfiguration underway.', by: adminId, byName: 'Dr. Sarah Jenkins' }
        ]
      },
      {
        ref: 'FC-2026-0005',
        title: '[DEMO DATA] Broken Desk Support Leg in Lecture Hall LH-102',
        desc: 'Row 3 desk 4 has a loose metal leg that wobbles when weight is applied.',
        cat: 'Furniture damage',
        loc: 'Engineering Block, Room LH-102',
        pri: 'low',
        status: 'pending',
        studentId: priyaId,
        assignedTo: null,
        hist: [
          { type: 'submitted', note: 'Routine furniture inspection report.', by: priyaId, byName: 'Priya Sharma [Demo Student]' }
        ]
      }
    ];

    for (const c of demoComplaints) {
      await withTransaction(async (client) => {
        // Insert or update complaint
        const compRes = await client.query(
          `INSERT INTO complaints (
             reference_number, title, description, category, location, priority,
             status, student_id, assigned_to, resolution_note, resolved_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (reference_number) DO UPDATE SET
             title = EXCLUDED.title,
             status = EXCLUDED.status,
             assigned_to = EXCLUDED.assigned_to,
             resolution_note = EXCLUDED.resolution_note,
             resolved_at = EXCLUDED.resolved_at
           RETURNING id;`,
          [
            c.ref, c.title, c.desc, c.cat, c.loc, c.pri,
            c.status, c.studentId, c.assignedTo, c.resNote || null, c.resolvedAt || null
          ]
        );

        const complaintId = compRes.rows[0].id;

        // Clean existing demo history for idempotency
        await client.query('DELETE FROM complaint_history WHERE complaint_id = $1;', [complaintId]);

        // Insert history
        for (const h of c.hist) {
          await client.query(
            `INSERT INTO complaint_history (
               complaint_id, changed_by, changed_by_name, event_type, old_value, new_value, note
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7);`,
            [complaintId, h.by, h.byName, h.type, h.old || null, h.new || null, h.note]
          );
        }
      });
      console.log(`📋 Seeded Complaint: ${c.ref} (${c.status})`);
    }

    console.log('----------------------------------------------------');
    console.log('✅ Development seeding completed successfully!');
    console.log('Demo Accounts:');
    console.log('  Admin:   admin@fixmycampus.edu   / AdminSecureCampus2026!');
    console.log('  Student: student@fixmycampus.edu / StudentPass123!');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Failed to seed development data:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDevelopmentData();
