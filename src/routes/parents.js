// routes/parents.js
import express from 'express';
import db from '../models/db.js';

const router = express.Router();

// UUID validation middleware
const validateUUID = (req, res, next) => {
  const { parentId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(parentId)) {
    return res.status(400).json({ 
      error: 'Invalid UUID format',
      message: 'Parent ID must be a valid UUID format',
      example: '1fd1d960-ee5d-40f7-882f-c8f6d43ae32a'
    });
  }
  
  next();
};

// Apply UUID validation to all parent routes
router.use('/:parentId', validateUUID);

// Get all children for a parent
router.get('/:parentId/children', async (req, res) => {
  try {
    const { parentId } = req.params;
    
    console.log('👨‍👩‍👧‍👦 Fetching children for parent:', parentId);
    
    const query = `
      SELECT 
        s.id,
        s.full_name,
        s.email,
        s.grade_level,
        s.class_name,
        COALESCE((
          SELECT AVG(sa.score) 
          FROM student_assessments sa 
          WHERE sa.student_id = s.id
        ), 0) as overall_average,
        COALESCE((
          SELECT AVG(ar.attendance_rate) 
          FROM attendance_records ar 
          WHERE ar.student_id = s.id
        ), 100) as attendance_rate
      FROM students s
      WHERE s.parent_id = $1
      ORDER BY s.full_name
    `;
    
    const result = await db.query(query, [parentId]);
    
    console.log('✅ Found', result.rows.length, 'children');
    
    // Transform to match your frontend Child interface
    const children = result.rows.map(row => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      grade_level: row.grade_level || 1,
      class_name: row.class_name || 'Not assigned',
      overall_average: Number(row.overall_average) || 0,
      attendance_rate: Number(row.attendance_rate) || 100
    }));
    
    res.json(children);
  } catch (error) {
    console.error('❌ Error fetching children:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get parent dashboard stats
router.get('/:parentId/stats', async (req, res) => {
  try {
    const { parentId } = req.params;
    
    console.log('📊 Fetching stats for parent:', parentId);
    
    const query = `
      SELECT 
        COUNT(s.id) as total_children,
        COALESCE(AVG(child_stats.overall_average), 0) as average_grade,
        COALESCE(AVG(child_stats.attendance_rate), 100) as average_attendance
      FROM students s
      LEFT JOIN (
        SELECT 
          s.id,
          COALESCE((
            SELECT AVG(sa.score) 
            FROM student_assessments sa 
            WHERE sa.student_id = s.id
          ), 0) as overall_average,
          COALESCE((
            SELECT AVG(ar.attendance_rate) 
            FROM attendance_records ar 
            WHERE ar.student_id = s.id
          ), 100) as attendance_rate
        FROM students s
        WHERE s.parent_id = $1
      ) child_stats ON s.id = child_stats.id
      WHERE s.parent_id = $1
    `;
    
    const result = await db.query(query, [parentId]);
    
    const stats = {
      total_children: Number(result.rows[0]?.total_children) || 0,
      average_grade: Number(result.rows[0]?.average_grade) || 0,
      average_attendance: Number(result.rows[0]?.average_attendance) || 100
    };
    
    console.log('✅ Stats:', stats);
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get recent activities for parent's children
router.get('/:parentId/activities', async (req, res) => {
  try {
    const { parentId } = req.params;
    
    console.log('📋 Fetching activities for parent:', parentId);
    
    // Get activities from your activities table
    const query = `
      SELECT 
        a.type,
        a.title,
        a.assessment_type,
        a.score,
        a.max_score,
        a.date,
        s.full_name as student_name
      FROM activities a
      JOIN students s ON a.student_id = s.id
      WHERE s.parent_id = $1
      ORDER BY a.date DESC, a.created_at DESC
      LIMIT 15
    `;
    
    const result = await db.query(query, [parentId]);
    
    console.log('✅ Found', result.rows.length, 'activities');
    
    // Transform to match your frontend Activity interface
    const activities = result.rows.map(row => ({
      type: row.type,
      score: row.score ? Number(row.score) : undefined,
      title: row.title,
      assessment_type: row.assessment_type,
      date: row.date.toISOString(),
      student_name: row.student_name
    }));
    
    res.json(activities);
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.json([]);
  }
});

// Get detailed child performance
router.get('/:parentId/children/:childId/performance', async (req, res) => {
  try {
    const { parentId, childId } = req.params;
    
    console.log('📈 Fetching performance for child:', childId);
    
    // Verify the child belongs to the parent
    const verifyQuery = `
      SELECT id FROM students WHERE id = $1 AND parent_id = $2
    `;
    const verifyResult = await db.query(verifyQuery, [childId, parentId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Child not found or does not belong to this parent'
      });
    }

    // Get overall performance
    const performanceQuery = `
      SELECT 
        COALESCE(AVG(sa.score), 0) as overall_average,
        COUNT(sa.id) as total_assessments,
        MAX(sa.submitted_at) as latest_assessment
      FROM student_assessments sa
      WHERE sa.student_id = $1
    `;
    
    const performanceResult = await db.query(performanceQuery, [childId]);
    
    // Get subject-wise breakdown
    const subjectsQuery = `
      SELECT 
        COALESCE(sub.name, 'Subject ' || a.subject_id) as subject,
        ROUND(AVG(sa.score)::numeric, 2) as average_score,
        COUNT(sa.id) as assessment_count,
        MAX(sa.score) as best_score,
        MIN(sa.score) as worst_score
      FROM student_assessments sa
      JOIN assessments a ON sa.assessment_id = a.id
      LEFT JOIN subjects sub ON sub.id = a.subject_id
      WHERE sa.student_id = $1
      GROUP BY a.subject_id, sub.name
      ORDER BY average_score DESC
    `;
    
    const subjectsResult = await db.query(subjectsQuery, [childId]);
    
    // Get recent assessments
    const recentQuery = `
      SELECT 
        a.title,
        COALESCE(sub.name, 'Subject ' || a.subject_id) as subject,
        a.type as assessment_type,
        sa.score,
        sa.submitted_at as date
      FROM student_assessments sa
      JOIN assessments a ON sa.assessment_id = a.id
      LEFT JOIN subjects sub ON sub.id = a.subject_id
      WHERE sa.student_id = $1
      ORDER BY sa.submitted_at DESC
      LIMIT 10
    `;
    
    const recentResult = await db.query(recentQuery, [childId]);
    
    console.log('✅ Performance data retrieved');
    
    res.json({
      overall: {
        average: Number(performanceResult.rows[0]?.overall_average) || 0,
        total_assessments: Number(performanceResult.rows[0]?.total_assessments) || 0,
        latest_assessment: performanceResult.rows[0]?.latest_assessment
      },
      by_subject: subjectsResult.rows.map(subject => ({
        subject: subject.subject,
        average_score: Number(subject.average_score) || 0,
        assessment_count: Number(subject.assessment_count) || 0,
        best_score: Number(subject.best_score) || 0,
        worst_score: Number(subject.worst_score) || 0
      })),
      recent_assessments: recentResult.rows.map(assessment => ({
        title: assessment.title,
        subject: assessment.subject,
        type: assessment.assessment_type,
        score: Number(assessment.score) || 0,
        date: assessment.date.toISOString()
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching child performance:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get child attendance details
router.get('/:parentId/children/:childId/attendance', async (req, res) => {
  try {
    const { parentId, childId } = req.params;
    const { start_date, end_date } = req.query;
    
    console.log('📅 Fetching attendance for child:', childId);
    
    // Verify the child belongs to the parent
    const verifyQuery = `
      SELECT id FROM students WHERE id = $1 AND parent_id = $2
    `;
    const verifyResult = await db.query(verifyQuery, [childId, parentId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Child not found or does not belong to this parent'
      });
    }

    let dateFilter = '';
    let params = [childId];
    
    if (start_date && end_date) {
      dateFilter = ' AND ar.date BETWEEN $2 AND $3';
      params.push(start_date, end_date);
    }

    // Get attendance summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_days,
        AVG(ar.attendance_rate) as average_rate,
        MIN(ar.attendance_rate) as min_rate,
        MAX(ar.attendance_rate) as max_rate,
        COUNT(CASE WHEN ar.attendance_rate < 75 THEN 1 END) as low_attendance_days
      FROM attendance_records ar
      WHERE ar.student_id = $1 ${dateFilter}
    `;
    
    const summaryResult = await db.query(summaryQuery, params);
    
    // Get monthly trends
    const trendsQuery = `
      SELECT 
        TO_CHAR(ar.date, 'YYYY-MM') as month,
        AVG(ar.attendance_rate) as monthly_average,
        COUNT(*) as records_count
      FROM attendance_records ar
      WHERE ar.student_id = $1
      GROUP BY TO_CHAR(ar.date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `;
    
    const trendsResult = await db.query(trendsQuery, [childId]);
    
    console.log('✅ Attendance data retrieved');
    
    res.json({
      summary: {
        total_days: Number(summaryResult.rows[0]?.total_days) || 0,
        average_rate: Number(summaryResult.rows[0]?.average_rate) || 100,
        min_rate: Number(summaryResult.rows[0]?.min_rate) || 100,
        max_rate: Number(summaryResult.rows[0]?.max_rate) || 100,
        low_attendance_days: Number(summaryResult.rows[0]?.low_attendance_days) || 0
      },
      trends: trendsResult.rows.map(trend => ({
        month: trend.month,
        average_rate: Number(trend.monthly_average) || 0,
        records_count: Number(trend.records_count) || 0
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching child attendance:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get child activities
router.get('/:parentId/children/:childId/activities', async (req, res) => {
  try {
    const { parentId, childId } = req.params;
    
    console.log('🎯 Fetching activities for child:', childId);
    
    // Verify parent owns this child
    const verifyQuery = `
      SELECT id FROM students WHERE id = $1 AND parent_id = $2
    `;
    const verifyResult = await db.query(verifyQuery, [childId, parentId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Child not found or does not belong to this parent'
      });
    }
    
    const query = `
      SELECT 
        a.type,
        a.title as activity,
        a.date,
        a.assessment_type as type,
        a.score
      FROM activities a
      WHERE a.student_id = $1
      ORDER BY a.date DESC
      LIMIT 50
    `;
    
    const result = await db.query(query, [childId]);
    
    console.log('✅ Found', result.rows.length, 'activities');
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching child activities:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get child app usage statistics
router.get('/:parentId/children/:childId/app-usage', async (req, res) => {
  try {
    const { parentId, childId } = req.params;
    const { period = 'weekly' } = req.query;
    
    console.log('💻 Fetching app usage for child:', childId);
    
    // Verify the child belongs to the parent
    const verifyQuery = `
      SELECT id FROM students WHERE id = $1 AND parent_id = $2
    `;
    const verifyResult = await db.query(verifyQuery, [childId, parentId]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Child not found or does not belong to this parent'
      });
    }

    // Calculate date range based on period
    let dateRange = 'INTERVAL \'7 days\'';
    switch (period) {
      case 'monthly':
        dateRange = 'INTERVAL \'30 days\'';
        break;
      case 'quarterly':
        dateRange = 'INTERVAL \'90 days\'';
        break;
      default:
        dateRange = 'INTERVAL \'7 days\'';
    }

    // Get usage summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COALESCE(SUM(sav.session_duration), 0) as total_minutes,
        COALESCE(AVG(sav.session_duration), 0) as average_session,
        MAX(sav.login_time) as last_activity,
        COUNT(DISTINCT DATE(sav.login_time)) as active_days
      FROM student_app_visits sav
      WHERE sav.student_id = $1 
      AND sav.login_time >= NOW() - ${dateRange}
    `;
    
    const summaryResult = await db.query(summaryQuery, [childId]);
    
    // Get daily breakdown
    const dailyQuery = `
      SELECT 
        DATE(sav.login_time) as visit_date,
        COUNT(*) as daily_sessions,
        COALESCE(SUM(sav.session_duration), 0) as daily_minutes
      FROM student_app_visits sav
      WHERE sav.student_id = $1 
      AND sav.login_time >= NOW() - ${dateRange}
      GROUP BY DATE(sav.login_time)
      ORDER BY visit_date DESC
    `;
    
    const dailyResult = await db.query(dailyQuery, [childId]);
    
    console.log('✅ App usage data retrieved');
    
    res.json({
      summary: {
        total_sessions: Number(summaryResult.rows[0]?.total_sessions) || 0,
        total_minutes: Number(summaryResult.rows[0]?.total_minutes) || 0,
        average_session: Number(summaryResult.rows[0]?.average_session) || 0,
        last_activity: summaryResult.rows[0]?.last_activity,
        active_days: Number(summaryResult.rows[0]?.active_days) || 0
      },
      daily_breakdown: dailyResult.rows.map(day => ({
        date: day.visit_date,
        sessions: Number(day.daily_sessions) || 0,
        minutes: Number(day.daily_minutes) || 0
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching app usage:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;