// controllers/analyticsController.js
const getClassPerformance = async (req, res) => {
    try {
        const { classId } = req.params;
        const { term, year } = req.query;
        
        const performance = await db.query(`
            SELECT 
                s.name as subject_name,
                AVG(er.marks_obtained) as average_marks,
                MAX(er.marks_obtained) as highest_marks,
                MIN(er.marks_obtained) as lowest_marks,
                COUNT(er.id) as total_students
            FROM exam_results er
            JOIN subjects s ON er.subject_id = s.id
            JOIN students st ON er.student_id = st.id
            JOIN exams e ON er.exam_id = e.id
            WHERE st.class_id = $1 
            AND e.term = $2 
            AND e.academic_year = $3
            GROUP BY s.id, s.name
        `, [classId, term, year]);
        
        res.json({
            success: true,
            data: performance.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getAtRiskStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        
        // Predictive algorithm for at-risk students
        const atRiskStudents = await db.query(`
            WITH student_performance AS (
                SELECT 
                    st.id,
                    st.admission_number,
                    u.first_name,
                    u.last_name,
                    AVG(er.marks_obtained) as overall_average,
                    COUNT(CASE WHEN er.marks_obtained < 50 THEN 1 END) as failed_subjects,
                    (SELECT COUNT(*) FROM attendance a 
                     WHERE a.student_id = st.id 
                     AND a.status = 'absent' 
                     AND a.date >= CURRENT_DATE - INTERVAL '30 days') as recent_absences
                FROM students st
                JOIN users u ON st.user_id = u.id
                LEFT JOIN exam_results er ON st.id = er.student_id
                WHERE st.class_id = $1
                GROUP BY st.id, u.first_name, u.last_name, st.admission_number
            )
            SELECT *,
                CASE 
                    WHEN overall_average < 45 OR failed_subjects > 3 OR recent_absences > 5 THEN 'High Risk'
                    WHEN overall_average < 55 OR failed_subjects > 1 OR recent_absences > 3 THEN 'Medium Risk'
                    ELSE 'Low Risk'
                END as risk_level
            FROM student_performance
            WHERE overall_average < 55 OR failed_subjects > 0 OR recent_absences > 3
            ORDER BY risk_level DESC, overall_average ASC
        `, [classId]);
        
        res.json({
            success: true,
            data: atRiskStudents.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
