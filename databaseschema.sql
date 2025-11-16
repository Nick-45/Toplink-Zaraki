-- Schools table
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url VARCHAR(500),
    academic_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table (handles all user types)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type ENUM('admin', 'teacher', 'principal', 'academic_master', 'ict_officer', 'parent', 'student'),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    admission_number VARCHAR(100) UNIQUE NOT NULL,
    class_id UUID REFERENCES classes(id),
    stream_id UUID REFERENCES streams(id),
    parent_id UUID REFERENCES users(id),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    enrollment_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Academic structure
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    name VARCHAR(100) NOT NULL, -- e.g., "Form 1", "Grade 5"
    level INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id),
    name VARCHAR(100) NOT NULL, -- e.g., "East", "West", "A", "B"
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Exam and performance management
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(100), -- "Mid-term", "End-term", "CAT", etc.
    term VARCHAR(50),
    academic_year VARCHAR(20),
    total_marks DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    exam_id UUID REFERENCES exams(id),
    subject_id UUID REFERENCES subjects(id),
    marks_obtained DECIMAL(5,2),
    grade VARCHAR(5),
    points INTEGER,
    teacher_comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, exam_id, subject_id)
);

-- Attendance system
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    class_id UUID REFERENCES classes(id),
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused'),
    recorded_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Communication system
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_audience VARCHAR(100), -- "all", "teachers", "parents", "students", "specific_class"
    target_class_id UUID REFERENCES classes(id),
    created_by UUID REFERENCES users(id),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SMS notifications
CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),
    recipient_phone VARCHAR(20),
    message TEXT,
    message_type VARCHAR(100), -- "attendance", "performance", "announcement", "fee"
    status VARCHAR(50), -- "sent", "failed", "delivered"
    cost DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT NOW()
);
