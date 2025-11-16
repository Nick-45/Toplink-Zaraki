// components/analytics/PerformanceChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceChartProps {
  data: Array<{
    subject: string;
    average: number;
    highest: number;
    lowest: number;
    classAverage: number;
  }>;
  title: string;
}

export function PerformanceChart({ data, title }: PerformanceChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="average" stroke="#3b82f6" name="Student Average" />
            <Line type="monotone" dataKey="classAverage" stroke="#10b981" name="Class Average" />
            <Line type="monotone" dataKey="highest" stroke="#ef4444" name="Highest" />
            <Line type="monotone" dataKey="lowest" stroke="#f59e0b" name="Lowest" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// components/dashboard/QuickStats.tsx
interface QuickStatsProps {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    averagePerformance: number;
  };
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Students</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.attendanceRate}%</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Avg Performance</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.averagePerformance}%</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-orange-100 text-orange-600">
            <ChalkboardTeacher className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Teachers</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalTeachers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
