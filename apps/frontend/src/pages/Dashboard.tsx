import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Note as NoteIcon,
  Folder as ProjectIcon,
  PictureAsPdf as PdfIcon,
  Storage as DatabaseIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Import our new UI components
import { Button, Card, Input, PanelLayout } from '../components/UI/index';
import { GridLayout, SinglePanelLayout } from '../components/Layout/Layout';

// Import services
import { notesApi, projectsApi, pdfsApi } from '../services/api';
import { useWorkspaceTabs } from './WorkspaceTabsContext';

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const { openTab } = useWorkspaceTabs();
  const [stats, setStats] = useState({
    notes: 0,
    projects: 0,
    pdfs: 0,
    database: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Memoize the loadDashboardData function to prevent unnecessary recreations
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API calls
      const [notesRes, projectsRes, pdfsRes, databaseRes] = await Promise.all([
        // Mock data for demonstration
        Promise.resolve({ data: Array.from({ length: 24 }, (_, i) => ({ id: i })) }),
        Promise.resolve({ data: Array.from({ length: 8 }, (_, i) => ({ id: i })) }),
        Promise.resolve({ data: Array.from({ length: 15 }, (_, i) => ({ id: i })) }),
        Promise.resolve({ data: Array.from({ length: 156 }, (_, i) => ({ id: i })) })
      ]);

      setStats({
        notes: notesRes.data.length,
        projects: projectsRes.data.length,
        pdfs: pdfsRes.data.length,
        database: databaseRes.data.length
      });

      // Mock recent activity
      setRecentActivity([
        { id: 1, type: 'note', title: 'Protein Expression Results', time: '2 hours ago', status: 'created' },
        { id: 2, type: 'project', title: 'CRISPR Optimization', time: '4 hours ago', status: 'updated' },
        { id: 3, type: 'pdf', title: 'Nature Paper on Gene Editing', time: '1 day ago', status: 'uploaded' },
        { id: 4, type: 'database', title: 'New Chemical Entry: DMSO', time: '2 days ago', status: 'added' }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Generate unique keys using a counter to avoid duplicates
  const keyCounter = React.useRef(0);
  const generateUniqueKey = (prefix: string) => `${prefix}-${Date.now()}-${++keyCounter.current}`;

  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    trend?: number;
  }) => {
    const getTabData = () => {
      switch (title.toLowerCase()) {
        case 'notes':
          return {
            key: generateUniqueKey('notes'),
            title: 'Notes',
            path: '/notes',
            icon: <NoteIcon />
          };
        case 'projects':
          return {
            key: generateUniqueKey('projects'),
            title: 'Projects',
            path: '/projects',
            icon: <ProjectIcon />
          };
        case 'pdfs':
          return {
            key: generateUniqueKey('pdfs'),
            title: 'PDF Management',
            path: '/pdfs',
            icon: <PdfIcon />
          };
        case 'database entries':
          return {
            key: generateUniqueKey('database'),
            title: 'Database',
            path: '/database',
            icon: <DatabaseIcon />
          };
        default:
          return {
            key: generateUniqueKey('dashboard'),
            title: 'Dashboard',
            path: '/dashboard',
            icon: <NoteIcon />
          };
      }
    };

    return (
      <Card
        className="hover-lift card-hover interactive cursor-pointer"
        hover
        onClick={() => {
          try {
            const tabData = getTabData();
            openTab(tabData);
            navigate(tabData.path);
          } catch (error) {
            console.error('Error opening tab:', error);
            // Fallback to direct navigation if tab opening fails
            navigate(getTabData().path);
          }
        }}
      >
        <Card.Content>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${color}20`, color: color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUpIcon className="w-4 h-4" />
                <span className="text-sm font-medium">+{trend}%</span>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    );
  };

  const ActivityItem = ({ activity }: { activity: any }) => {
    const getIcon = (type: string) => {
      switch (type) {
        case 'note': return <NoteIcon className="w-4 h-4" />;
        case 'project': return <ProjectIcon className="w-4 h-4" />;
        case 'pdf': return <PdfIcon className="w-4 h-4" />;
        case 'database': return <DatabaseIcon className="w-4 h-4" />;
        default: return <NoteIcon className="w-4 h-4" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'created': return 'bg-green-100 text-green-800';
        case 'updated': return 'bg-blue-100 text-blue-800';
        case 'uploaded': return 'bg-purple-100 text-purple-800';
        case 'added': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const handleActivityClick = () => {
      try {
        const getTabData = () => {
          switch (activity.type) {
            case 'note':
              return {
                key: generateUniqueKey(`note-${activity.id}`),
                title: activity.title,
                path: '/notes',
                icon: <NoteIcon />
              };
            case 'project':
              return {
                key: generateUniqueKey(`project-${activity.id}`),
                title: activity.title,
                path: '/projects',
                icon: <ProjectIcon />
              };
            case 'pdf':
              return {
                key: generateUniqueKey(`pdf-${activity.id}`),
                title: activity.title,
                path: '/pdfs',
                icon: <PdfIcon />
              };
            case 'database':
              return {
                key: generateUniqueKey(`database-${activity.id}`),
                title: activity.title,
                path: '/database',
                icon: <DatabaseIcon />
              };
            default:
              return {
                key: generateUniqueKey(`activity-${activity.id}`),
                title: activity.title,
                path: '/dashboard',
                icon: <NoteIcon />
              };
          }
        };

        const tabData = getTabData();
        openTab(tabData);
        navigate(tabData.path);
      } catch (error) {
        console.error('Error handling activity click:', error);
        // Fallback to direct navigation if tab opening fails
        navigate('/dashboard');
      }
    };

    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
        onClick={handleActivityClick}
      >
        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full text-gray-600">
          {getIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.title}
          </p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
          {activity.status}
        </span>
      </div>
    );
  };

  const QuickActions = () => (
    <Card className="hover-lift">
      <Card.Header>
        <Card.Title>Quick Actions</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-20 button-enhanced hover-grow"
            onClick={() => {
              openTab({
                key: generateUniqueKey('notes-new'),
                title: 'New Note',
                path: '/notes/new',
                icon: <NoteIcon />
              });
              navigate('/notes/new');
            }}
          >
            <AddIcon className="w-5 h-5" />
            <span className="text-sm">New Note</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-20 button-enhanced hover-grow"
            onClick={() => {
              openTab({
                key: generateUniqueKey('projects-new'),
                title: 'New Project',
                path: '/projects/new',
                icon: <ProjectIcon />
              });
              navigate('/projects/new');
            }}
          >
            <ProjectIcon className="w-5 h-5" />
            <span className="text-sm">New Project</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-20 button-enhanced hover-grow"
            onClick={() => {
              openTab({
                key: generateUniqueKey('pdfs-new'),
                title: 'PDF Management',
                path: '/pdfs',
                icon: <PdfIcon />
              });
              navigate('/pdfs');
            }}
          >
            <PdfIcon className="w-5 h-5" />
            <span className="text-sm">Upload PDF</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-20 button-enhanced hover-grow"
            onClick={() => {
              openTab({
                key: generateUniqueKey('database-new'),
                title: 'Database',
                path: '/database',
                icon: <DatabaseIcon />
              });
              navigate('/database');
            }}
          >
            <DatabaseIcon className="w-5 h-5" />
            <span className="text-sm">Add Entry</span>
          </Button>
        </div>
      </Card.Content>
    </Card>
  );

  const RecentActivity = () => (
    <Card className="hover-lift">
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title>Recent Activity</Card.Title>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className={`${refreshing ? 'animate-spin' : ''} button-enhanced`}
          >
            <RefreshIcon className="w-4 h-4" />
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="space-y-2 stagger-children">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="text-fade-in">
              <ActivityItem activity={activity} />
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );

  const UpcomingTasks = () => (
    <Card className="hover-lift">
      <Card.Header>
        <Card.Title>Upcoming Tasks</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          <div
            className="flex items-center gap-3 p-2 rounded border-l-4 border-red-400 bg-red-50 hover:bg-red-100 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              openTab({
                key: generateUniqueKey('task-lab-meeting'),
                title: 'Lab Meeting',
                path: '/tasks',
                icon: <CalendarIcon />
              });
              navigate('/tasks');
            }}
          >
            <CalendarIcon className="w-4 h-4 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Lab Meeting</p>
              <p className="text-xs text-red-700">Today at 2:00 PM</p>
            </div>
          </div>
          <div
            className="flex items-center gap-3 p-2 rounded border-l-4 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              openTab({
                key: generateUniqueKey('task-experiment-review'),
                title: 'Experiment Review',
                path: '/tasks',
                icon: <TimelineIcon />
              });
              navigate('/tasks');
            }}
          >
            <TimelineIcon className="w-4 h-4 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Experiment Review</p>
              <p className="text-xs text-yellow-700">Tomorrow at 10:00 AM</p>
            </div>
          </div>
          <div
            className="flex items-center gap-3 p-2 rounded border-l-4 border-blue-400 bg-blue-50 hover:bg-blue-100 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              openTab({
                key: generateUniqueKey('task-data-analysis'),
                title: 'Data Analysis',
                path: '/tasks',
                icon: <AnalyticsIcon />
              });
              navigate('/tasks');
            }}
          >
            <AnalyticsIcon className="w-4 h-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Data Analysis</p>
              <p className="text-xs text-blue-700">Due Friday</p>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SinglePanelLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </SinglePanelLayout>
    );
  }

  return (
    <div className="h-full p-6 bg-gray-50 overflow-auto">
      {/* Welcome Section */}
      <div className="mb-8 text-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Researcher
        </h1>
        <p className="text-gray-600">
          Here's what's happening in your lab today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
        <div className="text-fade-in">
          <StatCard
            title="Notes"
            value={stats.notes}
            icon={NoteIcon}
            color="#3B82F6"
            trend={12}
          />
        </div>
        <div className="text-fade-in">
          <StatCard
            title="Projects"
            value={stats.projects}
            icon={ProjectIcon}
            color="#10B981"
            trend={8}
          />
        </div>
        <div className="text-fade-in">
          <StatCard
            title="PDFs"
            value={stats.pdfs}
            icon={PdfIcon}
            color="#F59E0B"
            trend={5}
          />
        </div>
        <div className="text-fade-in">
          <StatCard
            title="Database Entries"
            value={stats.database}
            icon={DatabaseIcon}
            color="#8B5CF6"
            trend={15}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="text-fade-in">
            <RecentActivity />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="text-fade-in">
            <QuickActions />
          </div>
          <div className="text-fade-in">
            <UpcomingTasks />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard; 