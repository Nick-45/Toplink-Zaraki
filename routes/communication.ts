import express from 'express';
import { prisma } from '../server';
import { authenticate, authorize } from '../middleware/auth';
import notificationService from '../services/notificationService';
import smsService from '../services/smsService';

const router = express.Router();

// Create announcement
router.post('/announcements', authenticate, authorize(['admin', 'principal', 'teacher']), async (req: any, res) => {
  try {
    const { title, message, targetAudience, targetClassId } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        targetAudience,
        targetClassId,
        createdBy: req.user.userId,
        schoolId: req.user.schoolId,
        isPublished: true
      },
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        targetClass: true
      }
    });

    // Get recipients based on target audience
    let recipients: any[] = [];
    
    if (targetAudience === 'all') {
      recipients = await prisma.user.findMany({
        where: {
          schoolId: req.user.schoolId,
          userType: { in: ['parent', 'student', 'teacher'] }
        },
        select: {
          phone: true,
          userType: true
        }
      });
    } else if (targetAudience === 'parents') {
      recipients = await prisma.user.findMany({
        where: {
          schoolId: req.user.schoolId,
          userType: 'parent'
        },
        select: {
          phone: true
        }
      });
    } else if (targetAudience === 'teachers') {
      recipients = await prisma.user.findMany({
        where: {
          schoolId: req.user.schoolId,
          userType: { in: ['teacher', 'admin', 'principal'] }
        },
        select: {
          phone: true
        }
      });
    } else if (targetAudience === 'students') {
      recipients = await prisma.user.findMany({
        where: {
          schoolId: req.user.schoolId,
          userType: 'student'
        },
        select: {
          phone: true
        }
      });
    } else if (targetAudience === 'specific_class' && targetClassId) {
      recipients = await prisma.user.findMany({
        where: {
          student: {
            classId: targetClassId
          },
          schoolId: req.user.schoolId
        },
        select: {
          phone: true
        }
      });
    }

    // Send notifications
    await notificationService.sendAnnouncement(announcement, recipients);

    res.status(201).json({
      success: true,
      data: { announcement }
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get announcements
router.get('/announcements', authenticate, async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId: req.user.schoolId,
        isPublished: true
      },
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        targetClass: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.announcement.count({
      where: {
        schoolId: req.user.schoolId,
        isPublished: true
      }
    });

    res.json({
      success: true,
      data: {
        announcements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send message
router.post('/messages', authenticate, async (req: any, res) => {
  try {
    const { receiverId, subject, message } = req.body;

    const newMessage = await prisma.message.create({
      data: {
        senderId: req.user.userId,
        receiverId,
        subject,
        message
      },
      include: {
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            userType: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { message: newMessage }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get messages
router.get('/messages', authenticate, async (req: any, res) => {
  try {
    const { type = 'received', page = 1, limit = 20 } = req.query;

    let where: any = {};
    
    if (type === 'received') {
      where.receiverId = req.user.userId;
    } else if (type === 'sent') {
      where.senderId = req.user.userId;
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            userType: true
          }
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            userType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.message.count({ where });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark message as read
router.patch('/messages/:id/read', authenticate, async (req: any, res) => {
  try {
    const message = await prisma.message.update({
      where: {
        id: req.params.id,
        receiverId: req.user.userId
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      data: { message }
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send bulk SMS
router.post('/sms/send', authenticate, authorize(['admin', 'principal']), async (req: any, res) => {
  try {
    const { recipients, message, messageType } = req.body;

    const results = await smsService.sendBulkSMS(
      recipients,
      message,
      req.user.schoolId,
      messageType || 'general'
    );

    res.json({
      success: true,
      data: { results }
    });

  } catch (error) {
    console.error('Send bulk SMS error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
