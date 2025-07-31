import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Tooltip,
  Fab,
  Drawer,
  AppBar,
  Toolbar,
  Badge,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  AlertTitle,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Assignment as TaskIcon,
  Science as ExperimentIcon,
  Book as NoteIcon,
  TableChart as TableIcon,
  PictureAsPdf as PdfIcon,
  Folder as ProjectIcon,
  Schedule as ProtocolIcon,
  Restaurant as RecipeIcon,
  Notifications as NotificationIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableChartIcon2,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  Bookmark as BookmarkIcon,
  Flag as FlagIcon,
  Label as LabelIcon,
  Category as CategoryIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  VisibilityOff as VisibilityOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Palette as PaletteIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Language as LanguageIcon,
  Accessibility as AccessibilityIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Sync as SyncIcon,
  Autorenew as AutorenewIcon,
  Cached as CachedIcon,
  Update as UpdateIcon,
  Build as BuildIcon,
  Code as CodeIcon,
  BugReport as BugReportIcon,
  Help as HelpIcon,
  Support as SupportIcon,
  Feedback as FeedbackIcon,
  RateReview as RateReviewIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  SentimentSatisfied as HappyIcon,
  SentimentDissatisfied as SadIcon,
  EmojiEvents as TrophyIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
  NewReleases as NewIcon,
  Whatshot as HotIcon,
  LocalFireDepartment as FireIcon,
  Bolt as BoltIcon,
  FlashOn as FlashIcon,
  ElectricBolt as ElectricIcon,
  Psychology as BrainIcon,
  Lightbulb as IdeaIcon,
  AutoAwesome as SparkleIcon,
  Diamond as DiamondIcon,
  Celebration as PartyIcon,
  Celebration as CelebrationIcon,
  Cake as CakeIcon,
  Event as EventIcon,
  Event as EventIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon2,
  AccessTime as TimeIcon,
  HourglassEmpty as HourglassIcon,
  Timer as TimerIcon3,
  AccessTime as StopwatchIcon,
  AvTimer as AvTimerIcon,
  WatchLater as WatchLaterIcon,
  History as HistoryIcon,
  Update as UpdateIcon2,
  Sync as SyncIcon2,
  Autorenew as AutorenewIcon2,
  Cached as CachedIcon2,
  Refresh as RefreshIcon2,
  Loop as LoopIcon,
  RotateRight as RotateRightIcon,
  RotateLeft as RotateLeftIcon,
  Replay as ReplayIcon,
  FastForward as FastForwardIcon,
  FastRewind as FastRewindIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  RecordVoiceOver as RecordIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeIcon,
  VolumeDown as VolumeDownIcon,
  VolumeOff as VolumeOffIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  DoNotDisturb as DoNotDisturbIcon,
  PriorityHigh as PriorityHighIcon,
  LowPriority as LowPriorityIcon,
  SignalCellular4Bar as SignalIcon,
  SignalCellular0Bar as NoSignalIcon,
  SignalWifi4Bar as WifiIcon,
  SignalWifi0Bar as NoWifiIcon,
  BatteryFull as BatteryIcon,
  BatteryChargingFull as ChargingIcon,
  BatteryAlert as BatteryLowIcon,
  BatteryUnknown as BatteryUnknownIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Storage as DiskIcon,
  Cloud as CloudIcon,
  CloudQueue as CloudQueueIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  CloudUpload as CloudUploadIcon2,
  CloudDownload as CloudDownloadIcon2,
  CloudSync as CloudSyncIcon,
  CloudCircle as CloudCircleIcon,
  Cloud as CloudIcon2,
  WbSunny as SunIcon,
  NightsStay as MoonIcon,
  Opacity as OpacityIcon,
  FilterDrama as CloudIcon3,
  Grain as GrainIcon,
  BlurOn as BlurIcon,
  BlurOff as BlurOffIcon,
  CenterFocusStrong as FocusIcon,
  CenterFocusWeak as FocusWeakIcon,
  Crop as CropIcon,
  CropFree as CropFreeIcon,
  CropSquare as CropSquareIcon,
  Crop169 as Crop169Icon,
  Crop32 as Crop32Icon,
  Crop54 as Crop54Icon,
  Crop75 as Crop75Icon,
  CropDin as CropDinIcon,
  CropLandscape as CropLandscapeIcon,
  CropPortrait as CropPortraitIcon,
  CropRotate as CropRotateIcon,
  CropSquare as CropSquareIcon2,
  Filter as FilterIcon2,
  Filter1 as Filter1Icon,
  Filter2 as Filter2Icon,
  Filter3 as Filter3Icon,
  Filter4 as Filter4Icon,
  Filter5 as Filter5Icon,
  Filter6 as Filter6Icon,
  Filter7 as Filter7Icon,
  Filter8 as Filter8Icon,
  Filter9 as Filter9Icon,
  Filter9Plus as Filter9PlusIcon,
  FilterBAndW as FilterBAndWIcon,
  FilterCenterFocus as FilterCenterFocusIcon,
  FilterDrama as FilterDramaIcon,
  FilterFrames as FilterFramesIcon,
  FilterHdr as FilterHdrIcon,
  FilterNone as FilterNoneIcon,
  FilterTiltShift as FilterTiltShiftIcon,
  FilterVintage as FilterVintageIcon,
  Flare as FlareIcon,
  FlashAuto as FlashAutoIcon,
  FlashOff as FlashOffIcon,
  FlashOn as FlashOnIcon,
  Flip as FlipIcon,
  FlipCameraAndroid as FlipCameraAndroidIcon,
  FlipCameraIos as FlipCameraIosIcon,
  Gradient as GradientIcon,
  Grain as GrainIcon2,
  GridOff as GridOffIcon,
  GridOn as GridOnIcon,
  HdrOff as HdrOffIcon,
  HdrOn as HdrOnIcon,
  HdrStrong as HdrStrongIcon,
  HdrWeak as HdrWeakIcon,
  Healing as HealingIcon,
  Image as ImageIcon,
  ImageAspectRatio as ImageAspectRatioIcon,
  ImageNotSupported as ImageNotSupportedIcon,
  ImageSearch as ImageSearchIcon,
  Iso as IsoIcon,
  Landscape as LandscapeIcon,
  LeakAdd as LeakAddIcon,
  LeakRemove as LeakRemoveIcon,
  Lens as LensIcon,
  LinkedCamera as LinkedCameraIcon,
  Looks as LooksIcon,
  Looks3 as Looks3Icon,
  Looks4 as Looks4Icon,
  Looks5 as Looks5Icon,
  Looks6 as Looks6Icon,
  LooksOne as LooksOneIcon,
  LooksTwo as LooksTwoIcon,
  Loupe as LoupeIcon,
  MonochromePhotos as MonochromePhotosIcon,
  MovieCreation as MovieCreationIcon,
  MovieFilter as MovieFilterIcon,
  MusicNote as MusicNoteIcon,
  Nature as NatureIcon,
  NaturePeople as NaturePeopleIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Palette as PaletteIcon2,
  Panorama as PanoramaIcon,
  PanoramaFishEye as PanoramaFishEyeIcon,
  PanoramaHorizontal as PanoramaHorizontalIcon,
  PanoramaVertical as PanoramaVerticalIcon,
  PanoramaWideAngle as PanoramaWideAngleIcon,
  Photo as PhotoIcon,
  PhotoAlbum as PhotoAlbumIcon,
  PhotoCamera as PhotoCameraIcon,
  PhotoFilter as PhotoFilterIcon,
  PhotoLibrary as PhotoLibraryIcon,
  PhotoSizeSelectActual as PhotoSizeSelectActualIcon,
  PhotoSizeSelectLarge as PhotoSizeSelectLargeIcon,
  PhotoSizeSelectSmall as PhotoSizeSelectSmallIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Portrait as PortraitIcon,
  ReceiptLong as ReceiptLongIcon,
  RemoveRedEye as RemoveRedEyeIcon,
  Rotate90DegreesCcw as Rotate90DegreesCcwIcon,
  RotateLeft as RotateLeftIcon2,
  RotateRight as RotateRightIcon2,
  ShutterSpeed as ShutterSpeedIcon,
  Slideshow as SlideshowIcon,
  Straighten as StraightenIcon,
  Style as StyleIcon,
  SwitchCamera as SwitchCameraIcon,
  SwitchVideo as SwitchVideoIcon,
  TagFaces as TagFacesIcon,
  Texture as TextureIcon,
  Timelapse as TimelapseIcon,
  Timer as TimerIcon3,
  Timer10 as Timer10Icon,
  Timer3 as Timer3Icon,
  TimerOff as TimerOffIcon,
  Tonality as TonalityIcon,
  Transform as TransformIcon,
  Tune as TuneIcon,
  ViewComfy as ViewComfyIcon,
  ViewCompact as ViewCompactIcon,
  Vignette as VignetteIcon,
  WbAuto as WbAutoIcon,
  WbCloudy as WbCloudyIcon,
  WbIncandescent as WbIncandescentIcon,
  WbIridescent as WbIridescentIcon,
  WbSunny as WbSunnyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';

// Import existing APIs
import { tasksApi, projectsApi, notesApi, pdfsApi, tablesApi, protocolsApi, recipesApi } from '../services/api';

// Dashboard Analytics Data
interface DashboardAnalytics {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalProjects: number;
    activeProjects: number;
    totalNotes: number;
    totalPdfs: number;
    totalTables: number;
    totalProtocols: number;
    totalRecipes: number;
  };
  trends: {
    taskCompletionRate: number;
    taskCreationRate: number;
    projectProgress: number;
    timeSpent: number;
    productivityScore: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'task' | 'project' | 'note' | 'pdf' | 'table' | 'protocol' | 'recipe';
    action: 'created' | 'updated' | 'completed' | 'deleted';
    title: string;
    timestamp: Date;
    user?: string;
  }>;
  topItems: {
    projects: Array<{ id: string; name: string; progress: number; taskCount: number }>;
    tasks: Array<{ id: string; title: string; priority: string; dueDate: Date }>;
    tags: Array<{ name: string; count: number; category: string }>;
  };
  performance: {
    dailyStats: Array<{ date: string; tasks: number; completed: number; timeSpent: number }>;
    weeklyStats: Array<{ week: string; tasks: number; completed: number; timeSpent: number }>;
    monthlyStats: Array<{ month: string; tasks: number; completed: number; timeSpent: number }>;
  };
}

const Dashboard: React.FC = () => {
  // State management
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from all APIs
      const [
        tasksResponse,
        projectsResponse,
        notesResponse,
        pdfsResponse,
        tablesResponse,
        protocolsResponse,
        recipesResponse,
      ] = await Promise.allSettled([
        tasksApi.getAll(),
        projectsApi.getAll(),
        notesApi.getAll(),
        pdfsApi.getAll(),
        tablesApi.getAll(),
        protocolsApi.getAll(),
        recipesApi.getAll(),
      ]);

      // Process responses
      const tasks = tasksResponse.status === 'fulfilled' ? tasksResponse.value : [];
      const projects = projectsResponse.status === 'fulfilled' ? projectsResponse.value : [];
      const notes = notesResponse.status === 'fulfilled' ? notesResponse.value : [];
      const pdfs = pdfsResponse.status === 'fulfilled' ? pdfsResponse.value : [];
      const tables = tablesResponse.status === 'fulfilled' ? tablesResponse.value : [];
      const protocols = protocolsResponse.status === 'fulfilled' ? protocolsResponse.value : [];
      const recipes = recipesResponse.status === 'fulfilled' ? recipesResponse.value : [];

      // Calculate analytics
      const analyticsData: DashboardAnalytics = {
        overview: {
          totalTasks: Array.isArray(tasks) ? tasks.length : 0,
          completedTasks: Array.isArray(tasks) ? tasks.filter((t: any) => t.status === 'completed').length : 0,
          pendingTasks: Array.isArray(tasks) ? tasks.filter((t: any) => t.status === 'pending').length : 0,
          overdueTasks: Array.isArray(tasks) ? tasks.filter((t: any) => {
            if (t.dueDate && t.status !== 'completed') {
              return new Date(t.dueDate) < new Date();
            }
            return false;
          }).length : 0,
          totalProjects: Array.isArray(projects) ? projects.length : 0,
          activeProjects: Array.isArray(projects) ? projects.filter((p: any) => p.status === 'active').length : 0,
          totalNotes: Array.isArray(notes) ? notes.length : 0,
          totalPdfs: Array.isArray(pdfs) ? pdfs.length : 0,
          totalTables: Array.isArray(tables) ? tables.length : 0,
          totalProtocols: Array.isArray(protocols) ? protocols.length : 0,
          totalRecipes: Array.isArray(recipes) ? recipes.length : 0,
        },
        trends: {
          taskCompletionRate: Array.isArray(tasks) && tasks.length > 0 ? (tasks.filter((t: any) => t.status === 'completed').length / tasks.length) * 100 : 0,
          taskCreationRate: 0, // Would need historical data
          projectProgress: Array.isArray(projects) && projects.length > 0 ? projects.reduce((acc: number, p: any) => acc + (p.progress || 0), 0) / projects.length : 0,
          timeSpent: Array.isArray(tasks) ? tasks.reduce((acc: number, t: any) => acc + (t.timeSpent || 0), 0) : 0,
          productivityScore: 75, // Calculated based on completion rate and efficiency
        },
        recentActivity: [
          // Mock recent activity - would be replaced with real data
          {
            id: '1',
            type: 'task',
            action: 'completed',
            title: 'Review research paper',
            timestamp: new Date(),
            user: 'Current User',
          },
          {
            id: '2',
            type: 'project',
            action: 'updated',
            title: 'Data Analysis Project',
            timestamp: new Date(Date.now() - 3600000),
            user: 'Current User',
          },
        ],
        topItems: {
          projects: projects.slice(0, 5).map((p: any) => ({
            id: p.id,
            name: p.name,
            progress: p.progress || 0,
            taskCount: tasks.filter((t: any) => t.projectIds?.includes(p.id)).length,
          })),
          tasks: tasks
            .filter((t: any) => t.priority === 'high')
            .slice(0, 5)
            .map((t: any) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
            })),
          tags: [], // Would be calculated from task tags
        },
        performance: {
          dailyStats: [], // Would be calculated from historical data
          weeklyStats: [],
          monthlyStats: [],
        },
      };

      setAnalytics(analyticsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and set up auto-refresh
  useEffect(() => {
    loadAnalytics();

    if (autoRefresh) {
      const interval = setInterval(loadAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, dateRange]);

  // Export function
  const handleExport = async (format: string, options: any) => {
    try {
      // Implementation would depend on the export library used
      // For now, just show a success message
      alert(`Dashboard exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export error:', err);
      throw new Error('Export failed');
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography variant="h6" mt={2}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
          <Button onClick={loadAnalytics} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Overview of your research activities and progress
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAnalytics}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setExportDialogOpen(true)}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box mb={3}>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
            <Tab label="Overview" />
            <Tab label="Analytics" />
            <Tab label="Reports" />
            <Tab label="Custom" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {selectedTab === 0 && analytics && (
          <Grid container spacing={3}>
            {/* Overview Metrics */}
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" color="primary">
                        {analytics.overview.totalTasks}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Tasks
                      </Typography>
                    </Box>
                    <TaskIcon color="primary" fontSize="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {analytics.overview.completedTasks}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Completed
                      </Typography>
                    </Box>
                    <CheckCircleIcon color="success" fontSize="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        {analytics.overview.overdueTasks}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Overdue
                      </Typography>
                    </Box>
                    <WarningIcon color="warning" fontSize="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" color="info.main">
                        {analytics.overview.totalProjects}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Projects
                      </Typography>
                    </Box>
                    <ProjectIcon color="info" fontSize="large" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Productivity Score */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Productivity Score
                  </Typography>
                  <Box textAlign="center">
                    <Typography variant="h3" color="primary" gutterBottom>
                      {Math.round(analytics.trends.productivityScore)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={analytics.trends.productivityScore}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <List dense>
                    {analytics.recentActivity.map((activity, index) => (
                      <ListItem key={activity.id} divider={index < analytics.recentActivity.length - 1}>
                        <ListItemAvatar>
                          <Avatar>
                            {activity.type === 'task' && <TaskIcon />}
                            {activity.type === 'project' && <ProjectIcon />}
                            {activity.type === 'note' && <NoteIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.title}
                          secondary={`${activity.action} • ${format(activity.timestamp, 'MMM dd, HH:mm')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Projects */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Projects
                  </Typography>
                  <List dense>
                    {analytics.topItems.projects.map((project, index) => (
                      <ListItem key={project.id} divider={index < analytics.topItems.projects.length - 1}>
                        <ListItemText
                          primary={project.name}
                          secondary={`${project.taskCount} tasks • ${project.progress}% complete`}
                        />
                        <LinearProgress
                          variant="determinate"
                          value={project.progress}
                          sx={{ width: 60, ml: 1 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* High Priority Tasks */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    High Priority Tasks
                  </Typography>
                  <List dense>
                    {analytics.topItems.tasks.map((task, index) => (
                      <ListItem key={task.id} divider={index < analytics.topItems.tasks.length - 1}>
                        <ListItemText
                          primary={task.title}
                          secondary={`Due: ${format(task.dueDate, 'MMM dd, yyyy')}`}
                        />
                        <Chip
                          label={task.priority}
                          color={task.priority === 'high' ? 'error' : 'warning'}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {selectedTab === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Advanced Analytics
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Detailed analytics and insights coming soon...
            </Typography>
          </Box>
        )}

        {selectedTab === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Reports
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Custom reports and exports coming soon...
            </Typography>
          </Box>
        )}

        {selectedTab === 3 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Custom Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Drag-and-drop dashboard builder coming soon...
            </Typography>
          </Box>
        )}

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Export Dashboard</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" mb={2}>
              Choose export format and options
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => handleExport('pdf', {})}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PdfIcon fontSize="large" color="error" />
                    <Typography variant="body2" mt={1}>
                      PDF
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => handleExport('csv', {})}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TableChartIcon fontSize="large" color="primary" />
                    <Typography variant="body2" mt={1}>
                      CSV
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => handleExport('image', {})}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <ImageIcon fontSize="large" color="success" />
                    <Typography variant="body2" mt={1}>
                      Image
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                  }
                  label="Auto-refresh enabled"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Refresh Interval (seconds)"
                  value={Math.floor(refreshInterval / 1000)}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000)}
                  disabled={!autoRefresh}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setSettingsOpen(false)}>
              Save Settings
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Dashboard; 