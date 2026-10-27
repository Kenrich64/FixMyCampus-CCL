import { query, withTransaction } from '../config/db.js';
import { recommendPriority } from '../services/priorityRules.js';
import { enqueueNotificationJob } from '../services/sqsService.js';
import { getPresignedDownloadUrl } from '../services/s3Service.js';

const VALID_CATEGORIES = [
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

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES = ['pending', 'in_progress', 'resolved', 'rejected'];

/**
 * Generate Next Unique Sequential Reference Number
 * e.g. FC-2026-0001
 */
async function generateReferenceNumber(client) {
  const year = new Date().getFullYear();
  const seqRes = await client.query("SELECT nextval('complaint_ref_seq') AS num");
  const num = seqRes.rows[0].num;
  const padded = String(num).padStart(4, '0');
  return `FC-${year}-${padded}`;
}

/**
 * Get Priority Recommendation (Live preview endpoint for form)
 */
export async function getPriorityRecommendation(req, res) {
  const { category, title, description } = req.body;
  const recommendation = recommendPriority({ category, title, description });
  return res.json({ success: true, ...recommendation });
}

/**
 * Submit New Complaint
 */
export async function createComplaint(req, res, next) {
  try {
    const { title, description, category, location, priority: requestedPriority } = req.body;
    const studentId = req.user.id;
    const studentName = req.user.name;
    const studentEmail = req.user.email;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Title must be at least 5 characters long.' });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Description must be at least 10 characters long.' });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: 'A valid complaint category is required.' });
    }

    if (!location || location.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Specific campus location is required.' });
    }

    // Smart Rule-Based Priority Recommendation
    // Security & Business Rule: Students cannot override priority to skip triage.
    // Only administrators are permitted to manually override initial priority.
    const recommendation = recommendPriority({ category, title, description });
    const isAdmin = req.user.role === 'admin';
    const finalPriority = (isAdmin && requestedPriority && VALID_PRIORITIES.includes(requestedPriority))
      ? requestedPriority
      : recommendation.recommendedPriority;

    let createdComplaint = null;

    await withTransaction(async (client) => {
      const refNumber = await generateReferenceNumber(client);

      const compRes = await client.query(
        `INSERT INTO complaints (
           reference_number, title, description, category, location, priority,
           status, student_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *;`,
        [
          refNumber,
          title.trim(),
          description.trim(),
          category,
          location.trim(),
          finalPriority,
          'pending',
          studentId
        ]
      );

      createdComplaint = compRes.rows[0];

      // Add initial audit trail event
      await client.query(
        `INSERT INTO complaint_history (
           complaint_id, changed_by, changed_by_name, event_type, old_value, new_value, note
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          createdComplaint.id,
          studentId,
          studentName,
          'submitted',
          null,
          'pending',
          `Complaint registered. Priority recommended as ${recommendation.recommendedPriority.toUpperCase()} (${recommendation.reason})`
        ]
      );
    });

    // Enqueue Asynchronous Notification via SQS (Crucial: queue failure will not cancel complaint)
    enqueueNotificationJob({
      complaintId: createdComplaint.id,
      referenceNumber: createdComplaint.reference_number,
      title: createdComplaint.title,
      category: createdComplaint.category,
      priority: createdComplaint.priority,
      status: createdComplaint.status,
      eventType: 'submitted',
      recipientEmail: studentEmail,
      recipientName: studentName,
      actorName: studentName,
      note: `Complaint received and queued for review.`
    }).catch(err => console.error('[SQS Background Warning]:', err.message));

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint: createdComplaint,
      recommendation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List Complaints with Role-Based Access Control and Server-Side Filtering
 * - Students: View ONLY their own complaints
 * - Admins: View all complaints with category, priority, status, and search filters
 */
export async function getComplaints(req, res, next) {
  try {
    const isStudent = req.user.role === 'student';
    const { status, priority, category, search, page = 1, limit = 25 } = req.query;

    const conditions = [];
    const params = [];

    // Strict boundary: Student can only see their own
    if (isStudent) {
      params.push(req.user.id);
      conditions.push(`c.student_id = $${params.length}`);
    }

    if (status && VALID_STATUSES.includes(status)) {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }

    if (priority && VALID_PRIORITIES.includes(priority)) {
      params.push(priority);
      conditions.push(`c.priority = $${params.length}`);
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      params.push(category);
      conditions.push(`c.category = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const pIdx = params.length;
      conditions.push(`(c.title ILIKE $${pIdx} OR c.reference_number ILIKE $${pIdx} OR c.location ILIKE $${pIdx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matches for pagination
    const countQuery = `SELECT COUNT(*) AS total FROM complaints c ${whereClause}`;
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].total, 10);

    // Fetch records
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10));
    params.push(offset);

    const dataQuery = `
      SELECT
        c.*,
        u.name AS student_name,
        u.email AS student_email
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const result = await query(dataQuery, params);

    // Attach signed download URLs for evidence photos
    const complaintsWithUrls = await Promise.all(
      result.rows.map(async (comp) => {
        const evidenceUrl = comp.evidence_s3_key
          ? await getPresignedDownloadUrl(comp.evidence_s3_key)
          : null;
        return {
          ...comp,
          evidence_url: evidenceUrl
        };
      })
    );

    res.json({
      success: true,
      complaints: complaintsWithUrls,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalCount / parseInt(limit, 10)) || 1
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Complaint Details by ID with Full History Timeline
 */
export async function getComplaintById(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, error: 'Invalid complaint ID.' });
    }

    const compQuery = `
      SELECT
        c.*,
        u.name AS student_name,
        u.email AS student_email
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      WHERE c.id = $1;
    `;
    const compResult = await query(compQuery, [complaintId]);

    if (compResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Complaint not found.' });
    }

    const complaint = compResult.rows[0];

    // Security check: Student can only view their own complaint
    if (req.user.role === 'student' && complaint.student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot view this complaint.' });
    }

    // Fetch history timeline
    const historyQuery = `
      SELECT
        h.*
      FROM complaint_history h
      WHERE h.complaint_id = $1
      ORDER BY h.created_at ASC;
    `;
    const historyResult = await query(historyQuery, [complaintId]);

    // Generate signed S3 evidence download URL
    const evidenceUrl = complaint.evidence_s3_key
      ? await getPresignedDownloadUrl(complaint.evidence_s3_key)
      : null;

    res.json({
      success: true,
      complaint: {
        ...complaint,
        evidence_url: evidenceUrl
      },
      history: historyResult.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Complaint Status (Admin Only)
 */
export async function updateStatus(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    const { status, note } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` });
    }

    let updated = null;
    let oldStatus = null;
    let studentDetails = null;

    await withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT c.*, u.email AS student_email, u.name AS student_name
         FROM complaints c
         JOIN users u ON c.student_id = u.id
         WHERE c.id = $1;`,
        [complaintId]
      );

      if (existing.rows.length === 0) {
        throw { status: 404, message: 'Complaint not found.' };
      }

      oldStatus = existing.rows[0].status;
      studentDetails = existing.rows[0];

      const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;

      const updateRes = await client.query(
        `UPDATE complaints
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP,
             resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
         WHERE id = $2
         RETURNING *;`,
        [status, complaintId]
      );

      updated = updateRes.rows[0];

      // Record timeline history
      await client.query(
        `INSERT INTO complaint_history (
           complaint_id, changed_by, changed_by_name, event_type, old_value, new_value, note
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          complaintId,
          req.user.id,
          req.user.name,
          'status_changed',
          oldStatus,
          status,
          note || `Status changed from ${oldStatus} to ${status}.`
        ]
      );
    });

    // Enqueue async SQS notification
    enqueueNotificationJob({
      complaintId: updated.id,
      referenceNumber: updated.reference_number,
      title: updated.title,
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      eventType: 'status_changed',
      recipientEmail: studentDetails.student_email,
      recipientName: studentDetails.student_name,
      actorName: req.user.name,
      note: note || `Status updated to ${status}.`
    }).catch(err => console.error('[SQS Status Alert Warning]:', err.message));

    res.json({
      success: true,
      message: `Status updated to ${status}.`,
      complaint: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Complaint Priority (Admin Only)
 */
export async function updatePriority(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    const { priority, note } = req.body;

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, error: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(', ')}` });
    }

    let updated = null;
    let oldPriority = null;
    let studentDetails = null;

    await withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT c.*, u.email AS student_email, u.name AS student_name
         FROM complaints c
         JOIN users u ON c.student_id = u.id
         WHERE c.id = $1;`,
        [complaintId]
      );

      if (existing.rows.length === 0) {
        throw { status: 404, message: 'Complaint not found.' };
      }

      oldPriority = existing.rows[0].priority;
      studentDetails = existing.rows[0];

      const updateRes = await client.query(
        `UPDATE complaints
         SET priority = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *;`,
        [priority, complaintId]
      );

      updated = updateRes.rows[0];

      // Record timeline history
      await client.query(
        `INSERT INTO complaint_history (
           complaint_id, changed_by, changed_by_name, event_type, old_value, new_value, note
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          complaintId,
          req.user.id,
          req.user.name,
          'priority_changed',
          oldPriority,
          priority,
          note || `Priority changed from ${oldPriority} to ${priority}.`
        ]
      );
    });

    // Enqueue async SQS notification
    enqueueNotificationJob({
      complaintId: updated.id,
      referenceNumber: updated.reference_number,
      title: updated.title,
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      eventType: 'priority_changed',
      recipientEmail: studentDetails.student_email,
      recipientName: studentDetails.student_name,
      actorName: req.user.name,
      note: note || `Priority adjusted to ${priority}.`
    }).catch(err => console.error('[SQS Priority Alert Warning]:', err.message));

    res.json({
      success: true,
      message: `Priority updated to ${priority}.`,
      complaint: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign Complaint to Maintenance Personnel (Admin Only)
 */
export async function assignComplaint(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    const { assignedTo, note } = req.body;

    if (!assignedTo || typeof assignedTo !== 'string' || assignedTo.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Maintenance personnel name is required.' });
    }

    let updated = null;
    let oldAssigned = null;
    let studentDetails = null;

    await withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT c.*, u.email AS student_email, u.name AS student_name
         FROM complaints c
         JOIN users u ON c.student_id = u.id
         WHERE c.id = $1;`,
        [complaintId]
      );

      if (existing.rows.length === 0) {
        throw { status: 404, message: 'Complaint not found.' };
      }

      oldAssigned = existing.rows[0].assigned_to;
      studentDetails = existing.rows[0];

      const updateRes = await client.query(
        `UPDATE complaints
         SET assigned_to = $1,
             status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *;`,
        [assignedTo.trim(), complaintId]
      );

      updated = updateRes.rows[0];

      // Record timeline history
      await client.query(
        `INSERT INTO complaint_history (
           complaint_id, changed_by, changed_by_name, event_type, old_value, new_value, note
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          complaintId,
          req.user.id,
          req.user.name,
          'assigned',
          oldAssigned,
          assignedTo.trim(),
          note || `Assigned to ${assignedTo.trim()}.`
        ]
      );
    });

    // Enqueue async SQS notification
    enqueueNotificationJob({
      complaintId: updated.id,
      referenceNumber: updated.reference_number,
      title: updated.title,
      category: updated.category,
      priority: updated.priority,
      status: updated.status,
      eventType: 'assigned',
      recipientEmail: studentDetails.student_email,
      recipientName: studentDetails.student_name,
      actorName: req.user.name,
      note: `Assigned to maintenance technician: ${assignedTo.trim()}.`
    }).catch(err => console.error('[SQS Assign Alert Warning]:', err.message));

    res.json({
      success: true,
      message: `Complaint assigned to ${assignedTo.trim()}.`,
      complaint: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add Resolution or Administrator Note (Admin Only)
 */
export async function addNote(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    const { note, isResolutionNote = false } = req.body;

    if (!note || note.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Note text is required.' });
    }

    let updated = null;

    await withTransaction(async (client) => {
      const existing = await client.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
      if (existing.rows.length === 0) {
        throw { status: 404, message: 'Complaint not found.' };
      }

      if (isResolutionNote) {
        const updateRes = await client.query(
          `UPDATE complaints
           SET resolution_note = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING *;`,
          [note.trim(), complaintId]
        );
        updated = updateRes.rows[0];
      } else {
        updated = existing.rows[0];
      }

      // Record timeline history
      await client.query(
        `INSERT INTO complaint_history (
           complaint_id, changed_by, changed_by_name, event_type, old_value, new_value, note
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          complaintId,
          req.user.id,
          req.user.name,
          'note_added',
          null,
          isResolutionNote ? 'Resolution Note' : 'Internal Note',
          note.trim()
        ]
      );
    });

    res.json({
      success: true,
      message: 'Note added to complaint timeline.',
      complaint: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Complaint History Timeline
 */
export async function getComplaintHistory(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);

    // Verify complaint exists & access control
    const compResult = await query('SELECT student_id FROM complaints WHERE id = $1', [complaintId]);
    if (compResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Complaint not found.' });
    }

    if (req.user.role === 'student' && compResult.rows[0].student_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot view this complaint history.' });
    }

    const historyResult = await query(
      `SELECT * FROM complaint_history WHERE complaint_id = $1 ORDER BY created_at ASC;`,
      [complaintId]
    );

    res.json({
      success: true,
      history: historyResult.rows
    });
  } catch (error) {
    next(error);
  }
}
