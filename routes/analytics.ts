import express from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Class performance analytics
router.get('/performance/class/:classId', authenticate, async (req: any, res) => {
  try {
    const { classId } = req.params;
    const { term, academicYear } = req.query;

    const performance = await prisma.examResult.groupBy({
      by: ['subjectId'],
      where: {
        student: {
          classId: classId
        },
        exam: {
          term: term as string,
          academicYear: academicYear as string
        }
      },
      _avg: {
        marksObtained: true
      },
      _max: {
        marksObtained: true
      },
      _min: {
        marksObtained: true
      },
      _count: {
        marksObtained: true
      }
    });

    // Get subject details
    const subjects = await prisma.subject.findMany({
      where: {
        id: {
          in: performance.map(p => p.subjectId)
        }
      }
    });

    const performanceWithSubjects = performance.map(p => {
      const subject = subjects.find(s => s.id === p.subjectId);
      return {
        subjectId: p.subjectId,
        subjectName: subject?.name,
        averageMarks: p._avg.marksObtained,
        highestMarks: p._max.marksObtained,
        lowestMarks: p._min.marksObtained,
        totalStudents: p._count.marksObtained
      };
    });

    res.json({
      success: true,
      data: performanceWithSubjects
    });

  } catch (error) {
    console.error('Class performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Student performance trends
router.get('/performance/student/:studentId', authenticate, async (req: any, res) => {
  try {
    const { studentId } = req.params;

    const trends = await prisma.examResult.groupBy({
      by: ['examId', 'subjectId'],
      where: {
        studentId: studentId
      },
      _avg: {
        marksObtained: true
      },
      _max: {
        marksObtained: true
      }
    });

    // Get exam and subject details
    const exams = await prisma.exam.findMany({
      where: {
        id: {
          in: [...new Set(trends.map(t => t.examId))]
        }
      }
    });

    const subjects = await prisma.subject.findMany({
      where: {
        id: {
          in: [...new Set(trends.map(t => t.subjectId))]
        }
      }
    });

    const trendsWithDetails = trends.map(t => {
      const exam = exams.find(e => e.id === t.examId);
      const subject = subjects.find(s => s.id === t.subjectId);
      return {
        examName: exam?.name,
        subjectName: subject?.name,
        averageMarks: t._avg.marksObtained,
        highestMarks: t._max.marksObtained,
        term: exam?.term,
        academicYear: exam?.academicYear
      };
    });

    res.json({
      success: true,
      data: trendsWithDetails
    });

  } catch (error) {
    console.error('Student performance trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Attendance trends
router.get('/attendance/trends', authenticate, async (req: any, res) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const where: any = {
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    };

    if (classId) {
      where.classId = classId;
    } else {
      // School-wide trends
      where.student = {
        schoolId: req.user.schoolId
      };
    }

    const attendanceData = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where,
      _count: {
        id: true
      }
    });

    // Transform data for charts
    const dailyTrends = attendanceData.reduce((acc: any, item) => {
      const date = item.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, present: 0, absent: 0, late: 0, excused: 0 };
      }
      acc[date][item.status] = item._count.id;
      return acc;
    }, {});

    res.json({
      success: true,
      data: Object.values(dailyTrends)
    });

  } catch (error) {
    console.error('Attendance trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Predictive analytics - At-risk students
router.get('/predictive/at-risk', authenticate, async (req: any, res) => {
  try {
    const { classId } = req.query;

    const where: any = {
      schoolId: req.user.schoolId
    };

    if (classId) {
      where.classId = classId;
    }

    // Get students with their performance and attendance data
    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        class: true,
        stream: true,
        examResults: {
          include: {
            exam: true
          }
        },
        attendance: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    });

    const atRiskStudents = students.map(student => {
      // Calculate risk factors
      const recentResults = student.examResults.filter(er => 
        new Date(er.exam.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
      
      const averageMarks = recentResults.length > 0 
        ? recentResults.reduce((sum, er) => sum + er.marksObtained, 0) / recentResults.length
        : 0;

      const failedSubjects = recentResults.filter(er => er.marksObtained < 40).length;
      
      const recentAbsences = student.attendance.filter(a => a.status === 'absent').length;
      const totalRecentDays = 30; // Assuming 30 school days
      const attendanceRate = ((totalRecentDays - recentAbsences) / totalRecentDays) * 100;

      // Risk scoring algorithm
      let riskScore = 0;
      if (averageMarks < 45) riskScore += 3;
      else if (averageMarks < 55) riskScore += 2;
      else if (averageMarks < 65) riskScore += 1;

      if (failedSubjects > 3) riskScore += 3;
      else if (failedSubjects > 1) riskScore += 2;
      else if (failedSubjects > 0) riskScore += 1;

      if (attendanceRate < 70) riskScore += 3;
      else if (attendanceRate < 80) riskScore += 2;
      else if (attendanceRate < 90) riskScore += 1;

      let riskLevel = 'Low';
      if (riskScore >= 6) riskLevel = 'High';
      else if (riskScore >= 3) riskLevel = 'Medium';

      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        name: `${student.user.firstName} ${student.user.lastName}`,
        class: student.class.name,
        stream: student.stream?.name,
        averageMarks: Math.round(averageMarks * 100) / 100,
        failedSubjects,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        recentAbsences,
        riskScore,
        riskLevel
      };
    }).filter(student => student.riskLevel !== 'Low')
      .sort((a, b) => b.riskScore - a.riskScore);

    res.json({
      success: true,
      data: atRiskStudents
    });

  } catch (error) {
    console.error('Predictive analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
