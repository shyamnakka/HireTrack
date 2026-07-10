import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApplications } from '../api/applications';
import { getReminders } from '../api/reminders';
import { getInterviewsByApplication } from '../api/interviews';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Calendar, Bell, ExternalLink, Briefcase, LayoutDashboard } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [interviews, setInterviews] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partialErrorMsg, setPartialErrorMsg] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      setPartialErrorMsg(null);
      
      try {
        // Fetch applications and reminders in parallel
        const [appsData, remindersData] = await Promise.all([
          getApplications(),
          getReminders()
        ]);
        
        setApplications(appsData);
        setReminders(remindersData);

        // Fetch interviews in parallel for all retrieved applications
        if (appsData.length > 0) {
          const interviewRequests = appsData.map(app =>
            getInterviewsByApplication(app.id)
              .then(data => data.map(item => ({ ...item, application: app })))
              .catch(err => {
                console.error(`Failed to load interviews for application ID ${app.id}:`, err);
                setPartialErrorMsg('Some interviews could not be loaded. Summary metrics may be incomplete.');
                return [];
              })
          );
          const interviewsNested = await Promise.all(interviewRequests);
          setInterviews(interviewsNested.flat());
        } else {
          setInterviews([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError('Failed to load dashboard metrics. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper: Format timezone-aware ISO string to browser local timezone format
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoString;
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        dateStyle: 'medium'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded-md w-1/4" />
          <div className="h-4 bg-slate-200 rounded-md w-1/3" />
        </div>
        
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg border border-slate-200" />
          ))}
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-lg border border-slate-200" />
          <div className="h-96 bg-slate-200 rounded-lg border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50/20 text-center py-10 px-4 max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-bold text-rose-800 mb-2">Error Loading Dashboard</h2>
        <p className="text-sm text-rose-600 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} className="h-10">
          Retry Loading
        </Button>
      </Card>
    );
  }

  // Metric Computations based on backend schemas
  const totalAppsCount = applications.length;
  
  // Active statuses: Applied, Online Assessment, Technical Interview, HR Interview
  const activeStatuses = ['Applied', 'Online Assessment', 'Technical Interview', 'HR Interview'];
  const activeAppsCount = applications.filter(app => activeStatuses.includes(app.status)).length;
  
  // Upcoming Interviews: interview_date is in future and result is Pending
  const now = new Date();
  const upcomingInterviews = interviews
    .filter(int => new Date(int.interview_date) > now && int.result === 'Pending')
    .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));
  
  const upcomingInterviewsCount = upcomingInterviews.length;

  // Pending Reminders: is_completed is false
  const pendingReminders = reminders
    .filter(rem => !rem.is_completed)
    .sort((a, b) => new Date(a.reminder_date) - new Date(b.reminder_date));
  
  const pendingRemindersCount = pendingReminders.length;

  // Display limits
  const recentApplications = applications.slice(0, 5); // backend already sorts newest first
  const displayInterviews = upcomingInterviews.slice(0, 5);
  const displayReminders = pendingReminders.slice(0, 5);

  // Status badge color mapper
  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected': return 'emerald';
      case 'Rejected': return 'rose';
      case 'Withdrawn': return 'slate';
      case 'Applied': return 'indigo';
      default: return 'amber'; // Online Assessment, Technical Interview, HR Interview
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome / Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is an overview of your job placement tracking progress.
          </p>
        </div>
      </div>

      {partialErrorMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-sm font-medium">
          {partialErrorMsg}
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Applications Card */}
        <div className="bg-white border-l-4 border-slate-400 border border-slate-200 rounded-lg p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Applications</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalAppsCount}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
            <Briefcase className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

        {/* Active Applications Card */}
        <div className="bg-white border-l-4 border-indigo-500 border border-slate-200 rounded-lg p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Applications</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{activeAppsCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

        {/* Upcoming Interviews Card */}
        <div className="bg-white border-l-4 border-amber-500 border border-slate-200 rounded-lg p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Interviews</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{upcomingInterviewsCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Calendar className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

        {/* Pending Reminders Card */}
        <div className="bg-white border-l-4 border-rose-500 border border-slate-200 rounded-lg p-5 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Reminders</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pendingRemindersCount}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <Bell className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Applications</h2>
              <Link to="/applications" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                View All
              </Link>
            </div>
            
            {recentApplications.length === 0 ? (
              <EmptyState
                title="No applications tracked yet"
                description="Keep track of your placement roles and details in one dashboard."
                actionButton={
                  <Link to="/applications">
                    <Button className="h-10 mt-2">Add First Application</Button>
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto w-full -mx-6 px-6">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider rounded-l-md">Company</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Date</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider rounded-r-md">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                          <Link to={`/applications/${app.id}`} className="hover:text-indigo-600 transition-colors">
                            {app.company_name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 font-medium">{app.job_role}</td>
                        <td className="px-4 py-4 text-sm text-slate-500 font-medium">{app.job_location || 'N/A'}</td>
                        <td className="px-4 py-4 text-sm text-slate-500 font-medium">{formatDateOnly(app.applied_date)}</td>
                        <td className="px-4 py-4 text-sm">
                          <Badge color={getStatusColor(app.status)}>{app.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Next Interviews & Pending Tasks */}
        <div className="space-y-6">
          {/* Upcoming Interviews Section */}
          <Card className="border border-slate-200 shadow-sm bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4">Upcoming Interviews</h2>
            {displayInterviews.length === 0 ? (
              <EmptyState
                title="No upcoming interviews"
                description="Interview rounds can be scheduled from inside Application Details."
              />
            ) : (
              <div className="space-y-3">
                {displayInterviews.map((int) => (
                  <div key={int.id} className="flex flex-col p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:border-slate-200 transition-all">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-slate-900">{int.round_name}</h4>
                      <Badge color="amber">{int.interview_mode}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      at <span className="font-semibold text-slate-700">{int.application?.company_name}</span> ({int.application?.job_role})
                    </p>
                    <div className="flex items-center text-xs text-slate-500 mt-3 space-x-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(int.interview_date)}</span>
                    </div>
                    {int.meeting_link && (
                      <a
                        href={int.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-500 mt-3 font-semibold transition-colors"
                      >
                        Join Meeting <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Reminders Section */}
          <Card className="border border-slate-200 shadow-sm bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Pending Reminders</h2>
              <Link to="/reminders" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                View All
              </Link>
            </div>
            
            {displayReminders.length === 0 ? (
              <EmptyState
                title="All caught up!"
                description="Create reminders to keep track of tasks and deadlines."
                actionButton={
                  <Link to="/reminders">
                    <Button variant="secondary" className="h-10 mt-2">Set Reminder</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {displayReminders.map((rem) => (
                  <div key={rem.id} className="flex flex-col p-4 border border-slate-100 rounded-lg bg-slate-50/50 hover:border-slate-200 transition-all">
                    <h4 className="text-sm font-bold text-slate-900">{rem.title}</h4>
                    {rem.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">{rem.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center text-[11px] text-slate-500 space-x-1.5 font-medium">
                        <Bell className="w-3 h-3 text-slate-400" />
                        <span>{formatDateTime(rem.reminder_date)}</span>
                      </div>
                      <Badge color={rem.application_id ? 'indigo' : 'slate'}>
                        {rem.application_id ? rem.application?.company_name : 'General'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
