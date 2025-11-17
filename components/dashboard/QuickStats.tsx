import { Users, UserCheck, TrendingUp, ChalkboardTeacher } from 'lucide-react';

interface QuickStatsProps {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    averagePerformance: number;
  };
}

export function QuickStats({ stats }: QuickStatsProps) {
  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: UserCheck,
      color: 'green',
      change: '+2%',
    },
    {
      title: 'Avg Performance',
      value: `${stats.averagePerformance}%`,
      icon: TrendingUp,
      color: 'purple',
      change: '+5%',
    },
    {
      title: 'Teachers',
      value: stats.totalTeachers,
      icon: ChalkboardTeacher,
      color: 'orange',
      change: '+3%',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => (
        <div key={stat.title} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className={`text-sm text-${stat.color}-600`}>{stat.change} from last month</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
