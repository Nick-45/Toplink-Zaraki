import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { prisma } from '../server';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all exams
router.get('/', authenticate, async (req: any, res) => {
  try {
    const exams = await prisma.exam.findMany({
      where: {
        schoolId: req.user.schoolId
      },
      include: {
        _count: {
          select: {
            results: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { exams }
    });

  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create exam
router.post('/', authenticate, authorize(['admin', 'academic_master', 'teacher']), async (req: any, res) => {
  try {
    const { name, examType, term, academicYear, totalMarks } = req.body;

    const exam = await prisma.exam.create({
      data: {
        name,
        examType,
        term,
        academicYear,
        totalMarks: parseFloat(totalMarks),
        schoolId: req.user.schoolId
      }
    });

    res.status(201).json({
      success: true,
      data: { exam }
    });

  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload exam results via CSV
router.post('/:id/results/upload', 
  authenticate, 
  authorize(['admin', 'academic_master', 'teacher']),
  upload.single('file'),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required'
        });
      }

      const examId = req.params.id;
      const results: any[] = [];

      // Parse CSV file
      const stream = Readable.from(req.file.buffer);
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            const processedResults = [];

            for (const row of results) {
              const { admissionNumber, subjectCode, marks } = row;

              // Find student
              const student = await prisma.student.findUnique({
                where: { admissionNumber },
                include: { class: true }
              });

              if (!student) {
                console.warn(`Student not found: ${admissionNumber}`);
                continue;
              }

              // Find subject
              const subject = await prisma.subject.findFirst({
                where: {
                  code: subjectCode,
                  schoolId: req.user.schoolId
                }
              });

              if (!subject) {
                console.warn(`Subject not found: ${subjectCode}`);
                continue;
              }

              // Calculate grade and points
              const marksObtained = parseFloat(marks);
              const { grade, points } = calculateGradeAndPoints(marksObtained);

              processedResults.push({
                studentId: student.id,
                examId,
                subjectId: subject.id,
                marksObtained,
                grade,
                points
              });
            }

            // Bulk create results
            await prisma.examResult.createMany({
              data: processedResults,
              skipDuplicates: true
            });

            // Emit real-time update
            const io = req.app.get('io');
            io.to(`school-${req.user.schoolId}`).emit('results-uploaded', {
              examId,
              count: processedResults.length
            });

            res.json({
              success: true,
              message: `Successfully processed ${processedResults.length} results`
            });

          } catch (processingError) {
            console.error('CSV processing error:', processingError);
            res.status(500).json({
              success: false,
              message: 'Error processing CSV file'
            });
          }
        });

    } catch (error) {
      console.error('Upload results error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// Get exam results
router.get('/:id/results', authenticate, async (req: any, res) => {
  try {
    const { classId, subjectId } = req.query;

    const where: any = {
      examId: req.params.id
    };

    if (classId || subjectId) {
      where.AND = [];
      if (classId) {
        where.AND.push({
          student: {
            classId: classId
          }
        });
      }
      if (subjectId) {
        where.AND.push({
          subjectId: subjectId
        });
      }
    }

    const results = await prisma.examResult.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            class: true,
            stream: true
          }
        },
        subject: true
      },
      orderBy: [
        {
          subject: {
            name: 'asc'
          }
        },
        {
          marksObtained: 'desc'
        }
      ]
    });

    res.json({
      success: true,
      data: { results }
    });

  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Calculate grades and points
function calculateGradeAndPoints(marks: number): { grade: string; points: number } {
  if (marks >= 80) return { grade: 'A', points: 12 };
  if (marks >= 75) return { grade: 'A-', points: 11 };
  if (marks >= 70) return { grade: 'B+', points: 10 };
  if (marks >= 65) return { grade: 'B', points: 9 };
  if (marks >= 60) return { grade: 'B-', points: 8 };
  if (marks >= 55) return { grade: 'C+', points: 7 };
  if (marks >= 50) return { grade: 'C', points: 6 };
  if (marks >= 45) return { grade: 'C-', points: 5 };
  if (marks >= 40) return { grade: 'D+', points: 4 };
  if (marks >= 35) return { grade: 'D', points: 3 };
  if (marks >= 30) return { grade: 'D-', points: 2 };
  return { grade: 'E', points: 1 };
}

export default router;
