import express from 'express';
import { prisma } from '../server';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get all students (with filters)
router.get('/', authenticate, async (req: any, res) => {
  try {
    const { classId, streamId, page = 1, limit = 50 } = req.query;
    
    const where: any = {
      schoolId: req.user.schoolId
    };

    if (classId) where.classId = classId;
    if (streamId) where.streamId = streamId;

    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        class: true,
        stream: true,
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        }
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: {
        admissionNumber: 'asc'
      }
    });

    const total = await prisma.student.count({ where });

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get student by ID
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: {
        id: req.params.id,
        schoolId: req.user.schoolId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        class: true,
        stream: true,
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: { student }
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create student
router.post('/', authenticate, authorize(['admin', 'academic_master']), async (req: any, res) => {
  try {
    const {
      admissionNumber,
      firstName,
      lastName,
      email,
      phone,
      classId,
      streamId,
      parentId,
      dateOfBirth,
      gender
    } = req.body;

    // Check if admission number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { admissionNumber }
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Admission number already exists'
      });
    }

    // Create user account for student
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        firstName,
        lastName,
        passwordHash: await bcrypt.hash('password123', 12), // Default password
        userType: 'student',
        schoolId: req.user.schoolId
      }
    });

    // Create student record
    const student = await prisma.student.create({
      data: {
        admissionNumber,
        userId: user.id,
        classId,
        streamId,
        parentId,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        enrollmentDate: new Date()
      },
      include: {
        user: true,
        class: true,
        stream: true
      }
    });

    res.status(201).json({
      success: true,
      data: { student }
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get student performance
router.get('/:id/performance', authenticate, async (req: any, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: {
        id: req.params.id,
        schoolId: req.user.schoolId
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get exam results with subject details
    const results = await prisma.examResult.findMany({
      where: {
        studentId: req.params.id
      },
      include: {
        exam: true,
        subject: true
      },
      orderBy: {
        exam: {
          createdAt: 'desc'
        }
      }
    });

    // Calculate overall performance
    const performance = await prisma.examResult.groupBy({
      by: ['examId'],
      where: {
        studentId: req.params.id
      },
      _avg: {
        marksObtained: true
      },
      _max: {
        marksObtained: true
      },
      _min: {
        marksObtained: true
      }
    });

    res.json({
      success: true,
      data: {
        results,
        performance
      }
    });

  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
