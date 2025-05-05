import { 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Activity, 
  DollarSign 
} from 'lucide-react';

const Dashboard = () => {
  // Sample data
  const recentActivity = [
    { id: 1, action: 'Updated Business Plan', user: 'John Doe', time: '2 hours ago' },
    { id: 2, action: 'Added Team Member', user: 'Sarah Johnson', time: '4 hours ago' },
    { id: 3, action: 'Created Financial Report', user: 'Michael Chen', time: 'Yesterday' },
    { id: 4, action: 'Updated Market Analysis', user: 'John Doe', time: 'Yesterday' },
    { id: 5, action: 'Shared Business Plan', user: 'Lisa Wong', time: '3 days ago' },
  ];

  const upcomingTasks = [
    { id: 1, task: 'Complete Q4 Financial Projection', dueDate: 'Tomorrow', priority: 'High' },
    { id: 2, task: 'Review Marketing Strategy', dueDate: 'Dec 15', priority: 'Medium' },
    { id: 3, task: 'Team Meeting', dueDate: 'Dec 17', priority: 'Medium' },
    { id: 4, task: 'Investor Presentation', dueDate: 'Dec 20', priority: 'High' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Plan Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back. Here's an overview of your business planning progress.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Plans</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">4 total plans</p>
            <div className="flex items-center text-green-500 text-xs font-medium">
              <TrendingUp size={14} className="mr-1" />
              <span>+15%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">7</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">5 active now</p>
            <div className="flex items-center text-green-500 text-xs font-medium">
              <TrendingUp size={14} className="mr-1" />
              <span>+3 new</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Completion</p>
              <p className="text-2xl font-bold text-gray-900">68%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Revenue Forecast</p>
              <p className="text-2xl font-bold text-gray-900">$1.2M</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">Q1 2024</p>
            <div className="flex items-center text-green-500 text-xs font-medium">
              <TrendingUp size={14} className="mr-1" />
              <span>+8.5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Business Health</h2>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center">
              <div className="flex items-center">
                <PieChart size={32} className="text-blue-600 mr-3" />
                <p className="text-gray-500">Business health charts would appear here</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
          </div>
          <div className="p-4">
            <ul className="divide-y divide-gray-200">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="py-3 px-2">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">{task.task}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === 'High' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Calendar size={14} className="mr-1" />
                    <span className="mr-3">Due: {task.dueDate}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <ul className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="py-4 flex">
                <div className="mr-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Activity size={20} className="text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <div className="flex items-center mt-1">
                    <p className="text-sm text-gray-500 mr-2">by {activity.user}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock size={12} className="mr-1" />
                      {activity.time}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 