import express from 'express';
import { prisma } from '../server';
import { authenticate, authorize } from '../middleware/auth';
import notificationService from '../services/notificationService';

const router = express.Router();

// Mark attendance
router.post('/mark', authenticate, authorize(['teacher', 'admin']), async (req: any, res) => {
  try {
    const { studentId, classId, date, status, notes } = req.body;

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        classId,
        date: new Date(date),
        status,
        recordedBy: req.user.userId,
        notes
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            parent: {
              include: {
                user: {
                  select: {
                    phone: true
                  }
                }
              }
            }
          }
        },
        class: true
      }
    });

    // Send notification for absent students
    if (status === 'absent') {
      const student = attendance.student;
      if (student.parent?.user?.phone) {
        await notificationService.sendAttendanceAlert(student, {
          date: attendance.date,
          totalAbsences: 1 // You'd calculate this from the database
        });
      }
    }

    res.status(201).json({
      success: true,
      data: { attendance }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk mark attendance
router.post('/mark/bulk', authenticate, authorize(['teacher', 'admin']), async (req: any, res) => {
  try {
    const { classId, date, attendanceRecords } = req.body;

    const records = attendanceRecords.map((record: any) => ({
      studentId: record.studentId,
      classId,
      date: new Date(date),
      status: record.status,
      recordedBy: req.user.userId,
      notes: record.notes
    }));

    const result = await prisma.attendance.createMany({
      data: records,
      skipDuplicates: true
    });

    // Get absent students for notifications
    const absentStudentIds = attendanceRecords
      .filter((r: any) => r.status === 'absent')
      .map((r: any) => r.studentId);

    if (absentStudentIds.length > 0) {
      const absentStudents = await prisma.student.findMany({
        where: {
          id: { in: absentStudentIds }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          parent: {
            include: {
              user: {
                select: {
                  phone: true
                }
              }
            }
          }
        }
      });

      for (const student of absentStudents) {
        if (student.parent?.user?.phone) {
          await notificationService.sendAttendanceAlert(student, {
            date: new Date(date),
            totalAbsences: 1
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Attendance marked for ${result.count} students`
    });

  } catch (error) {
    console.error('Bulk attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get class attendance
router.get('/class/:classId', authenticate, async (req: any, res) => {
  try {
    const { classId } = req.params;
    const { date, startDate, endDate } = req.query;

    let where: any = {
      classId,
      student: {
        schoolId: req.user.schoolId
      }
    };

    if (date) {
      where.date = new Date(date as string);
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        recordedByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json({
      success: true,
      data: { attendance }
    });

  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get student attendance
router.get('/student/:studentId', authenticate, async (req: any, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      studentId,
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    };

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        class: true,
        recordedByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate attendance summary
    const summary = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length,
      total: attendance.length
    };

    res.json({
      success: true,
      data: {
        attendance,
        summary
      }
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get attendance summary
router.get('/summary', authenticate, async (req: any, res) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const where: any = {
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      },
      student: {
        schoolId: req.user.schoolId
      }
    };

    if (classId) {
      where.classId = classId;
    }

    const attendance = await prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    const total = attendance.reduce((sum, item) => sum + item._count.id, 0);

    const summary = {
      present: attendance.find(a => a.status === 'present')?._count.id || 0,
      absent: attendance.find(a => a.status === 'absent')?._count.id || 0,
      late: attendance.find(a => a.status === 'late')?._count.id || 0,
      excused: attendance.find(a => a.status === 'excused')?._count.id || 0,
      total
    };

    res.json({
      success: true,
      data: { summary }
    });

  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
