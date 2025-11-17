'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceTrendChartProps {
  data: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }>;
  title: string;
}

export function AttendanceTrendChart({ data, title }: AttendanceTrendChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#10b981" name="Present" />
            <Bar dataKey="absent" fill="#ef4444" name="Absent" />
            <Bar dataKey="late" fill="#f59e0b" name="Late" />
            <Bar dataKey="excused" fill="#6b7280" name="Excused" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
