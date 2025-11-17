import { io } from '../server';
import smsService from './smsService';

class NotificationService {
  async sendPerformanceAlert(student: any, performanceData: any) {
    // Send to parent via SMS
    if (student.parent?.user?.phone) {
      const message = `Performance Alert: ${student.user.firstName} scored ${performanceData.averageMarks}% average. Weak in ${performanceData.weakSubjects.join(', ')}.`;
      await smsService.sendSMS(
        student.parent.user.phone,
        message,
        student.schoolId,
        'performance_alert'
      );
    }

    // Real-time notification to teachers
    io.to(`school-${student.schoolId}`).emit('performance-alert', {
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      ...performanceData
    });
  }

  async sendAttendanceAlert(student: any, attendanceData: any) {
    if (student.parent?.user?.phone) {
      const message = `Attendance Alert: ${student.user.firstName} was absent on ${attendanceData.date}. Total absences this month: ${attendanceData.totalAbsences}.`;
      await smsService.sendSMS(
        student.parent.user.phone,
        message,
        student.schoolId,
        'attendance_alert'
      );
    }

    io.to(`school-${student.schoolId}`).emit('attendance-alert', {
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      ...attendanceData
    });
  }

  async sendAnnouncement(announcement: any, recipients: any[]) {
    // Send SMS to all recipients with phones
    const phoneRecipients = recipients.filter(r => r.phone).map(r => r.phone);
    
    if (phoneRecipients.length > 0) {
      await smsService.sendBulkSMS(
        phoneRecipients,
        `Announcement: ${announcement.title} - ${announcement.message.substring(0, 100)}...`,
        announcement.schoolId,
        'announcement'
      );
    }

    // Real-time notification
    io.to(`school-${announcement.schoolId}`).emit('new-announcement', announcement);
  }
}

export default new NotificationService();
