import { query } from '../config/db.js';

/**
 * Student Dashboard Metrics
 */
export async function getStudentDashboard(req, res, next) {
  try {
    const studentId = req.user.id;

    // Aggregated status counts for student
    const statsQuery = `
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved
      FROM complaints
      WHERE student_id = $1;
    `;
    const statsResult = await query(statsQuery, [studentId]);
    const counts = statsResult.rows[0];

    // Recent 5 complaints submitted by student
    const recentQuery = `
      SELECT
        id, reference_number, title, category, location, priority, status, created_at, updated_at
      FROM complaints
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    const recentResult = await query(recentQuery, [studentId]);

    res.json({
      success: true,
      metrics: {
        total: parseInt(counts.total || 0, 10),
        pending: parseInt(counts.pending || 0, 10),
        inProgress: parseInt(counts.in_progress || 0, 10),
        resolved: parseInt(counts.resolved || 0, 10)
      },
      recentComplaints: recentResult.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Administrator Dashboard Metrics & Analytics
 */
export async function getAdminDashboard(req, res, next) {
  try {
    // 1. High-level metric counts
    const overviewQuery = `
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status IN ('pending', 'in_progress') THEN 1 END) AS open,
        COUNT(CASE WHEN priority IN ('high', 'urgent') AND status != 'resolved' THEN 1 END) AS high_priority,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved,
        AVG(CASE
          WHEN status = 'resolved' AND resolved_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
          ELSE NULL
        END) AS avg_resolution_hours
      FROM complaints;
    `;
    const overviewResult = await query(overviewQuery);
    const overview = overviewResult.rows[0];

    // 2. Complaint distribution by category
    const categoryQuery = `
      SELECT
        category,
        COUNT(*) AS count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC;
    `;
    const categoryResult = await query(categoryQuery);

    // 3. Status distribution
    const statusQuery = `
      SELECT
        status,
        COUNT(*) AS count
      FROM complaints
      GROUP BY status;
    `;
    const statusResult = await query(statusQuery);

    // 4. Priority distribution
    const priorityQuery = `
      SELECT
        priority,
        COUNT(*) AS count
      FROM complaints
      GROUP BY priority;
    `;
    const priorityResult = await query(priorityQuery);

    // 5. Complaints trend over time (by date)
    const trendQuery = `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
        COUNT(*) AS count
      FROM complaints
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 14;
    `;
    const trendResult = await query(trendQuery);

    // 6. Recent 5 complaints across campus
    const recentQuery = `
      SELECT
        c.id, c.reference_number, c.title, c.category, c.location,
        c.priority, c.status, c.created_at, u.name AS student_name
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 5;
    `;
    const recentResult = await query(recentQuery);

    const avgHours = overview.avg_resolution_hours !== null
      ? parseFloat(Number(overview.avg_resolution_hours).toFixed(1))
      : 0;

    res.json({
      success: true,
      metrics: {
        total: parseInt(overview.total || 0, 10),
        open: parseInt(overview.open || 0, 10),
        highPriority: parseInt(overview.high_priority || 0, 10),
        resolved: parseInt(overview.resolved || 0, 10),
        avgResolutionHours: avgHours
      },
      distribution: {
        byCategory: categoryResult.rows.map(r => ({ category: r.category, count: parseInt(r.count, 10) })),
        byStatus: statusResult.rows.map(r => ({ status: r.status, count: parseInt(r.count, 10) })),
        byPriority: priorityResult.rows.map(r => ({ priority: r.priority, count: parseInt(r.count, 10) }))
      },
      timelineTrend: trendResult.rows.map(r => ({ date: r.date, complaints: parseInt(r.count, 10) })),
      recentComplaints: recentResult.rows
    });
  } catch (error) {
    next(error);
  }
}
