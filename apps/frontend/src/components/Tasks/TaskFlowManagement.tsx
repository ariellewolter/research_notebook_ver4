import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Switch,
    FormControlLabel,
    Autocomplete,
    LinearProgress,
    Snackbar,
    Tabs,
    Tab,
    Badge,
    Avatar,
    Stack
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Stop as StopIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    AccountTree as WorkflowIcon,
    Timeline as TimelineIcon,
    AutoGraph as AutoGraphIcon,
    Settings as SettingsIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    Analytics as AnalyticsIcon,
    ViewTimeline as ViewTimelineIcon,
    PlaylistPlay as PlaylistPlayIcon,
    Rule as RuleIcon,
    IntegrationInstructions as IntegrationIcon
} from '@mui/icons-material';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    EdgeTypes,
    NodeTypes,
    MarkerType,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { taskDependenciesApi, tasksApi } from '../../services/api';

interface TaskFlow {
    id: string;
    name: string;
    description?: string;
    type: 'sequential' | 'parallel' | 'conditional' | 'mixed';
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    nodes: TaskFlowNode[];
    edges: TaskFlowEdge[];
    triggers: TaskFlowTrigger[];
    rules: TaskFlowRule[];
    metadata: any;
    createdAt: string;
    updatedAt: string;
    executionHistory: TaskFlowExecution[];
}

interface TaskFlowNode {
    id: string;
    type: 'task' | 'decision' | 'start' | 'end' | 'subprocess' | 'wait' | 'notification';
    position: { x: number; y: number };
    data: {
        label: string;
        taskId?: string;
        taskTitle?: string;
        condition?: string;
        action?: string;
        duration?: number;
        notificationType?: string;
        subprocessId?: string;
        metadata?: any;
    };
}

interface TaskFlowEdge {
    id: string;
    source: string;
    target: string;
    type: 'default' | 'conditional' | 'parallel';
    label?: string;
    condition?: string;
    style?: any;
}

interface TaskFlowTrigger {
    id: string;
    type: 'manual' | 'schedule' | 'event' | 'condition';
    name: string;
    config: {
        schedule?: string;
        eventType?: string;
        condition?: string;
        enabled: boolean;
    };
}

interface TaskFlowRule {
    id: string;
    name: string;
    type: 'automation' | 'validation' | 'notification' | 'escalation';
    condition: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    enabled: boolean;
}

interface TaskFlowExecution {
    id: string;
    flowId: string;
    status: 'running' | 'completed' | 'failed' | 'paused';
    startTime: string;
    endTime?: string;
    currentNode?: string;
    progress: number;
    logs: ExecutionLog[];
    metadata?: any;
}

interface ExecutionLog {
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'success';
    message: string;
    nodeId?: string;
    data?: any;
}

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline?: string;
}

interface TaskFlowManagementProps {
    open: boolean;
    onClose: () => void;
    selectedTasks?: Task[];
}

const nodeTypes = {
    task: TaskNode,
    decision: DecisionNode,
    start: StartNode,
    end: EndNode,
    subprocess: SubprocessNode,
    wait: WaitNode,
    notification: NotificationNode
};

const edgeTypes: EdgeTypes = {
    conditional: ConditionalEdge
};

const TaskFlowManagement: React.FC<TaskFlowManagementProps> = ({
    open,
    onClose,
    selectedTasks = []
}) => {
    const [flows, setFlows] = useState<TaskFlow[]>([]);
    const [currentFlow, setCurrentFlow] = useState<TaskFlow | null>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Flow creation/editing states
    const [flowDialogOpen, setFlowDialogOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<TaskFlow | null>(null);
    const [newFlow, setNewFlow] = useState({
        name: '',
        description: '',
        type: 'sequential' as const
    });

    // Execution states
    const [executingFlows, setExecutingFlows] = useState<Set<string>>(new Set());
    const [executionHistory, setExecutionHistory] = useState<TaskFlowExecution[]>([]);

    // Available tasks for flow building
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (open) {
            loadFlows();
            loadAvailableTasks();
        }
    }, [open]);

    useEffect(() => {
        if (currentFlow) {
            setNodes(currentFlow.nodes);
            setEdges(currentFlow.edges);
        }
    }, [currentFlow]);

    const loadFlows = async () => {
        try {
            setLoading(true);
            const response = await taskDependenciesApi.getWorkflows();
            setFlows(response.data.data || []);
        } catch (error: any) {
            console.error('Error loading flows:', error);
            setError('Failed to load task flows');
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableTasks = async () => {
        try {
            const response = await tasksApi.getTasks();
            setAvailableTasks(response.data.data || []);
        } catch (error: any) {
            console.error('Error loading tasks:', error);
        }
    };

    const handleCreateFlow = () => {
        setEditingFlow(null);
        setNewFlow({ name: '', description: '', type: 'sequential' });
        setFlowDialogOpen(true);
    };

    const handleEditFlow = (flow: TaskFlow) => {
        setEditingFlow(flow);
        setNewFlow({
            name: flow.name,
            description: flow.description || '',
            type: flow.type
        });
        setFlowDialogOpen(true);
    };

    const handleSaveFlow = async () => {
        try {
            setLoading(true);
            const flowData = {
                ...newFlow,
                nodes,
                edges,
                triggers: editingFlow?.triggers || [],
                rules: editingFlow?.rules || [],
                metadata: editingFlow?.metadata || {}
            };

            if (editingFlow) {
                await taskDependenciesApi.updateWorkflow(editingFlow.id, flowData);
                setSuccess('Flow updated successfully');
            } else {
                await taskDependenciesApi.createWorkflow(flowData);
                setSuccess('Flow created successfully');
            }

            setFlowDialogOpen(false);
            loadFlows();
        } catch (error: any) {
            console.error('Error saving flow:', error);
            setError('Failed to save flow');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFlow = async (flowId: string) => {
        if (window.confirm('Are you sure you want to delete this flow?')) {
            try {
                await taskDependenciesApi.deleteWorkflow(flowId);
                setSuccess('Flow deleted successfully');
                loadFlows();
            } catch (error: any) {
                console.error('Error deleting flow:', error);
                setError('Failed to delete flow');
            }
        }
    };

    const handleExecuteFlow = async (flow: TaskFlow) => {
        try {
            setExecutingFlows(prev => new Set(prev).add(flow.id));
            const response = await taskDependenciesApi.executeWorkflow(flow.id);
            setSuccess(`Flow "${flow.name}" execution started`);

            // Monitor execution progress
            monitorExecution(flow.id, response.data.executionId);
        } catch (error: any) {
            console.error('Error executing flow:', error);
            setError('Failed to execute flow');
        } finally {
            setExecutingFlows(prev => {
                const newSet = new Set(prev);
                newSet.delete(flow.id);
                return newSet;
            });
        }
    };

    const monitorExecution = async (flowId: string, executionId: string) => {
        const interval = setInterval(async () => {
            try {
                const response = await taskDependenciesApi.getExecutionStatus(executionId);
                const execution = response.data.execution;

                setExecutionHistory(prev => {
                    const filtered = prev.filter(e => e.id !== executionId);
                    return [...filtered, execution];
                });

                if (['completed', 'failed'].includes(execution.status)) {
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Error monitoring execution:', error);
                clearInterval(interval);
            }
        }, 2000);
    };

    const handleAddNode = (type: string, position: { x: number; y: number }) => {
        const newNode: TaskFlowNode = {
            id: `${type}_${Date.now()}`,
            type: type as any,
            position,
            data: {
                label: `New ${type}`,
                taskId: type === 'task' ? availableTasks[0]?.id : undefined,
                taskTitle: type === 'task' ? availableTasks[0]?.title : undefined
            }
        };
        setNodes(prev => [...prev, newNode]);
    };

    const handleAddEdge = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const getFlowStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#4caf50';
            case 'paused': return '#ff9800';
            case 'completed': return '#2196f3';
            case 'archived': return '#9e9e9e';
            default: return '#666';
        }
    };

    const getFlowTypeIcon = (type: string) => {
        switch (type) {
            case 'sequential': return <TimelineIcon />;
            case 'parallel': return <AutoGraphIcon />;
            case 'conditional': return <RuleIcon />;
            case 'mixed': return <IntegrationIcon />;
            default: return <WorkflowIcon />;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h5" display="flex" alignItems="center" gap={1}>
                        <WorkflowIcon /> Task Flow Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateFlow}
                    >
                        Create Flow
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ height: '70vh', display: 'flex' }}>
                    {/* Sidebar */}
                    <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                            <Tab label="Flows" />
                            <Tab label="Execution" />
                            <Tab label="Analytics" />
                        </Tabs>

                        <Box sx={{ p: 2 }}>
                            {activeTab === 0 && (
                                <FlowsList
                                    flows={flows}
                                    currentFlow={currentFlow}
                                    onSelectFlow={setCurrentFlow}
                                    onEditFlow={handleEditFlow}
                                    onDeleteFlow={handleDeleteFlow}
                                    onExecuteFlow={handleExecuteFlow}
                                    executingFlows={executingFlows}
                                />
                            )}

                            {activeTab === 1 && (
                                <ExecutionHistory
                                    history={executionHistory}
                                    flows={flows}
                                />
                            )}

                            {activeTab === 2 && (
                                <FlowAnalytics
                                    flows={flows}
                                    executionHistory={executionHistory}
                                />
                            )}
                        </Box>
                    </Box>

                    {/* Main Content */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {currentFlow ? (
                            <>
                                {/* Flow Header */}
                                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h6">{currentFlow.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {currentFlow.description}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" gap={1}>
                                            <Chip
                                                label={currentFlow.status}
                                                color={currentFlow.status === 'active' ? 'success' : 'default'}
                                                size="small"
                                            />
                                            <Chip
                                                icon={getFlowTypeIcon(currentFlow.type)}
                                                label={currentFlow.type}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Flow Canvas */}
                                <Box sx={{ flex: 1, position: 'relative' }}>
                                    <ReactFlow
                                        nodes={nodes}
                                        edges={edges}
                                        onNodesChange={onNodesChange}
                                        onEdgesChange={onEdgesChange}
                                        onConnect={handleAddEdge}
                                        nodeTypes={nodeTypes}
                                        edgeTypes={edgeTypes}
                                        fitView
                                    >
                                        <Controls />
                                        <Background />
                                    </ReactFlow>

                                    {/* Node Palette */}
                                    <NodePalette onAddNode={handleAddNode} />
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="h6" color="text.secondary">
                                    Select a flow to view and edit
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>

            {/* Flow Creation/Editing Dialog */}
            <FlowDialog
                open={flowDialogOpen}
                onClose={() => setFlowDialogOpen(false)}
                flow={editingFlow}
                newFlow={newFlow}
                setNewFlow={setNewFlow}
                onSave={handleSaveFlow}
                loading={loading}
            />

            {/* Notifications */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>

            <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
                <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
            </Snackbar>
        </Dialog>
    );
};

// Custom Node Components
function TaskNode({ data }: { data: any }) {
    return (
        <Card sx={{ minWidth: 150, border: '2px solid #2196f3' }}>
            <CardContent sx={{ p: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    {data.label}
                </Typography>
                {data.taskTitle && (
                    <Typography variant="caption" color="text.secondary">
                        {data.taskTitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

function DecisionNode({ data }: { data: any }) {
    return (
        <Box
            sx={{
                width: 120,
                height: 60,
                border: '2px solid #ff9800',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper'
            }}
        >
            <Typography variant="body2" textAlign="center">
                {data.label}
            </Typography>
        </Box>
    );
}

function StartNode({ data }: { data: any }) {
    return (
        <Box
            sx={{
                width: 80,
                height: 40,
                border: '2px solid #4caf50',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper'
            }}
        >
            <Typography variant="body2">
                {data.label}
            </Typography>
        </Box>
    );
}

function EndNode({ data }: { data: any }) {
    return (
        <Box
            sx={{
                width: 80,
                height: 40,
                border: '2px solid #f44336',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper'
            }}
        >
            <Typography variant="body2">
                {data.label}
            </Typography>
        </Box>
    );
}

function SubprocessNode({ data }: { data: any }) {
    return (
        <Card sx={{ minWidth: 150, border: '2px solid #9c27b0' }}>
            <CardContent sx={{ p: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    {data.label}
                </Typography>
            </CardContent>
        </Card>
    );
}

function WaitNode({ data }: { data: any }) {
    return (
        <Card sx={{ minWidth: 150, border: '2px solid #607d8b' }}>
            <CardContent sx={{ p: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    {data.label}
                </Typography>
                {data.duration && (
                    <Typography variant="caption" color="text.secondary">
                        {data.duration} min
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

function NotificationNode({ data }: { data: any }) {
    return (
        <Card sx={{ minWidth: 150, border: '2px solid #00bcd4' }}>
            <CardContent sx={{ p: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                    {data.label}
                </Typography>
                {data.notificationType && (
                    <Typography variant="caption" color="text.secondary">
                        {data.notificationType}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

// Custom Edge Component
function ConditionalEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }: any) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    return (
        <>
            <path
                id={id}
                style={style}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
        </>
    );
}

// Helper Components
function FlowsList({ flows, currentFlow, onSelectFlow, onEditFlow, onDeleteFlow, onExecuteFlow, executingFlows }: any) {
    return (
        <List>
            {flows.map((flow) => (
                <ListItem
                    key={flow.id}
                    selected={currentFlow?.id === flow.id}
                    onClick={() => onSelectFlow(flow)}
                    sx={{ cursor: 'pointer' }}
                >
                    <ListItemIcon>
                        {getFlowTypeIcon(flow.type)}
                    </ListItemIcon>
                    <ListItemText
                        primary={flow.name}
                        secondary={
                            <Box>
                                <Chip
                                    label={flow.status}
                                    size="small"
                                    sx={{ mr: 1, fontSize: '0.7rem' }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {flow.nodes.length} nodes
                                </Typography>
                            </Box>
                        }
                    />
                    <ListItemSecondaryAction>
                        <Box display="flex" gap={0.5}>
                            <Tooltip title="Execute">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onExecuteFlow(flow);
                                    }}
                                    disabled={executingFlows.has(flow.id)}
                                >
                                    {executingFlows.has(flow.id) ? (
                                        <CircularProgress size={16} />
                                    ) : (
                                        <PlayIcon />
                                    )}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditFlow(flow);
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteFlow(flow.id);
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </ListItemSecondaryAction>
                </ListItem>
            ))}
        </List>
    );
}

function ExecutionHistory({ history, flows }: any) {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Execution History</Typography>
            <List>
                {history.map((execution) => (
                    <ListItem key={execution.id}>
                        <ListItemIcon>
                            {execution.status === 'completed' && <CheckCircleIcon color="success" />}
                            {execution.status === 'running' && <CircularProgress size={20} />}
                            {execution.status === 'failed' && <ErrorIcon color="error" />}
                        </ListItemIcon>
                        <ListItemText
                            primary={flows.find((f: any) => f.id === execution.flowId)?.name || 'Unknown Flow'}
                            secondary={
                                <Box>
                                    <Typography variant="caption" display="block">
                                        {execution.status} • {new Date(execution.startTime).toLocaleString()}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={execution.progress}
                                        sx={{ mt: 1 }}
                                    />
                                </Box>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

function FlowAnalytics({ flows, executionHistory }: any) {
    const totalFlows = flows.length;
    const activeFlows = flows.filter((f: any) => f.status === 'active').length;
    const totalExecutions = executionHistory.length;
    const successfulExecutions = executionHistory.filter((e: any) => e.status === 'completed').length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Analytics</Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4">{totalFlows}</Typography>
                            <Typography variant="body2" color="text.secondary">Total Flows</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4">{activeFlows}</Typography>
                            <Typography variant="body2" color="text.secondary">Active Flows</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4">{totalExecutions}</Typography>
                            <Typography variant="body2" color="text.secondary">Total Executions</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4">{successRate.toFixed(1)}%</Typography>
                            <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

function NodePalette({ onAddNode }: any) {
    const nodeTypes = [
        { type: 'start', label: 'Start', icon: <PlayIcon /> },
        { type: 'task', label: 'Task', icon: <WorkflowIcon /> },
        { type: 'decision', label: 'Decision', icon: <RuleIcon /> },
        { type: 'wait', label: 'Wait', icon: <ScheduleIcon /> },
        { type: 'notification', label: 'Notification', icon: <InfoIcon /> },
        { type: 'subprocess', label: 'Subprocess', icon: <IntegrationIcon /> },
        { type: 'end', label: 'End', icon: <StopIcon /> }
    ];

    return (
        <Paper
            sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                p: 1,
                zIndex: 1000
            }}
        >
            <Typography variant="caption" display="block" gutterBottom>
                Add Node
            </Typography>
            <Stack spacing={0.5}>
                {nodeTypes.map((nodeType) => (
                    <Tooltip key={nodeType.type} title={nodeType.label}>
                        <IconButton
                            size="small"
                            onClick={() => onAddNode(nodeType.type, { x: 100, y: 100 })}
                        >
                            {nodeType.icon}
                        </IconButton>
                    </Tooltip>
                ))}
            </Stack>
        </Paper>
    );
}

function FlowDialog({ open, onClose, flow, newFlow, setNewFlow, onSave, loading }: any) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {flow ? 'Edit Flow' : 'Create New Flow'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1 }}>
                    <TextField
                        fullWidth
                        label="Flow Name"
                        value={newFlow.name}
                        onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={newFlow.description}
                        onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Flow Type</InputLabel>
                        <Select
                            value={newFlow.type}
                            label="Flow Type"
                            onChange={(e) => setNewFlow({ ...newFlow, type: e.target.value })}
                        >
                            <MenuItem value="sequential">Sequential</MenuItem>
                            <MenuItem value="parallel">Parallel</MenuItem>
                            <MenuItem value="conditional">Conditional</MenuItem>
                            <MenuItem value="mixed">Mixed</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={onSave}
                    variant="contained"
                    disabled={!newFlow.name || loading}
                >
                    {loading ? <CircularProgress size={20} /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Helper function for bezier path calculation
function getBezierPath({ sourceX, sourceY, targetX, targetY }: any) {
    const centerX = (sourceX + targetX) / 2;
    const centerY = (sourceY + targetY) / 2;

    return [
        `M ${sourceX} ${sourceY} Q ${centerX} ${centerY} ${targetX} ${targetY}`,
        centerX,
        centerY
    ];
}

export default TaskFlowManagement; 