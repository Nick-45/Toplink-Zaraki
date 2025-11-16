// Authentication Routes
POST /api/auth/login
POST /api/auth/register
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/me

// Student Management
GET /api/students
POST /api/students
GET /api/students/:id
PUT /api/students/:id
DELETE /api/students/:id
GET /api/students/:id/performance
GET /api/students/:id/attendance

// Exam Management
GET /api/exams
POST /api/exams
GET /api/exams/:id
PUT /api/exams/:id
POST /api/exams/:id/results/upload
GET /api/exams/:id/results
GET /api/exams/:id/analytics

// Attendance
POST /api/attendance/mark
GET /api/attendance/class/:classId
GET /api/attendance/student/:studentId
GET /api/attendance/summary

// Analytics
GET /api/analytics/performance/class/:classId
GET /api/analytics/performance/subject/:subjectId
GET /api/analytics/performance/student/:studentId
GET /api/analytics/attendance/trends
GET /api/analytics/predictive/at-risk

// Communication
POST /api/announcements
GET /api/announcements
POST /api/messages
GET /api/messages
POST /api/sms/send
