// app/dashboard/teacher/page.tsx
export default function TeacherDashboard() {
  const [quickActions] = useState([
    { title: 'Mark Attendance', icon: UserCheck, href: '/attendance/mark', color: 'green' },
    { title: 'Upload Results', icon: Upload, href: '/exams/upload', color: 'blue' },
    { title: 'Send Message', icon: MessageCircle, href: '/communication/messages', color: 'purple' },
    { title: 'View Analytics', icon: BarChart3, href: '/analytics/performance', color: 'orange' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome back, Mr. Kamau
        </div>
      </div>
      
      <QuickStats stats={{
        totalStudents: 45,
        totalTeachers: 12,
        attendanceRate: 94,
        averagePerformance: 76
      }} />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-3`}>
              <action.icon className={`h-6 w-6 text-${action.color}-600`} />
            </div>
            <p className="font-medium text-gray-900">{action.title}</p>
          </Link>
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
