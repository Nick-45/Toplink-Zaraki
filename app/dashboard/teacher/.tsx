'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Upload, MessageCircle, BarChart3 } from 'lucide-react';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { AttendanceTrendChart } from '@/components/analytics/AttendanceTrendChart';
import api from '@/lib/api';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  averagePerformance: number;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    attendanceRate: 0,
    averagePerformance: 0
  });
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { title: 'Mark Attendance', icon: UserCheck, href: '/attendance/mark', color: 'green' },
    { title: 'Upload Results', icon: Upload, href: '/exams/upload', color: 'blue' },
    { title: 'Send Message', icon: MessageCircle, href: '/communication/messages', color: 'purple' },
    { title: 'View Analytics', icon: BarChart3, href: '/analytics/performance', color: 'orange' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, you'd have dedicated dashboard endpoints
        const [studentsRes, attendanceRes, performanceRes] = await Promise.all([
          api.get('/students?limit=1'),
          api.get('/analytics/attendance/trends?days=30'),
          api.get('/analytics/performance/class/current')
        ]);

        // Mock data processing - replace with actual calculations
        setStats({
          totalStudents: studentsRes.data.data.pagination.total,
          totalTeachers: 12, // This would come from a teachers endpoint
          attendanceRate: 94,
          averagePerformance: 76
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Mock data for charts
  const performanceData = [
    { subject: 'Math', average: 76, highest: 98, lowest: 45, classAverage: 72 },
    { subject: 'English', average: 82, highest: 95, lowest: 52, classAverage: 78 },
    { subject: 'Science', average: 71, highest: 92, lowest: 38, classAverage: 68 },
    { subject: 'History', average: 85, highest: 96, lowest: 58, classAverage: 80 },
    { subject: 'Geography', average: 79, highest: 94, lowest: 49, classAverage: 75 },
  ];

  const attendanceData = [
    { date: '2024-01', present: 42, absent: 3, late: 2, excused: 1 },
    { date: '2024-02', present: 44, absent: 1, late: 1, excused: 2 },
    { date: '2024-03', present: 43, absent: 2, late: 3, excused: 0 },
    { date: '2024-04', present: 45, absent: 0, late: 1, excused: 2 },
    { date: '2024-05', present: 44, absent: 1, late: 2, excused: 1 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome back, Mr. Kamau
        </div>
      </div>
      
      <QuickStats stats={stats} />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <a
            key={action.title}
            href={action.href}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow block"
          >
            <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-3`}>
              <action.icon className={`h-6 w-6 text-${action.color}-600`} />
            </div>
            <p className="font-medium text-gray-900">{action.title}</p>
          </a>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart 
          data={performanceData} 
          title="Class Performance Overview" 
        />
        <AttendanceTrendChart 
          data={attendanceData} 
          title="Attendance Trends" 
        />
      </div>
    </div>
  );
}
