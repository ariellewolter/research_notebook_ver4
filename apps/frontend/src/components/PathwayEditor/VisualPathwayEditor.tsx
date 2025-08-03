import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Button, TextField, 
    Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Alert, IconButton, Tooltip, Divider, Paper,
    FormControl, InputLabel, Select, MenuItem, Switch,
    FormControlLabel, Accordion, AccordionSummary, AccordionDetails,
    Grid, List, ListItem, ListItemText, ListItemIcon,
    Drawer, AppBar, Toolbar, Tabs, Tab, Slider
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
    Save as SaveIcon, Undo as UndoIcon, Redo as RedoIcon,
    ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon,
    FitScreen as FitScreenIcon, Download as DownloadIcon,
    Upload as UploadIcon, Settings as SettingsIcon,
    Science as ScienceIcon, Biotech as BiotechIcon,
    LocalHospital as LocalHospitalIcon, WaterDrop as WaterDropIcon,
    Timeline as TimelineIcon, AccountTree as AccountTreeIcon
} from '@mui/icons-material';
import ReactFlow, {
    Node, Edge, addEdge, Connection, useNodesState, useEdgesState,
    Controls, Background, MiniMap, Panel, Handle, Position,
    ReactFlowProvider, useReactFlow, MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

interface PathwayNode {
    id: string;
    type: 'gene' | 'protein' | 'metabolite' | 'reaction' | 'pathway' | 'disease' | 'drug';
    data: {
        label: string;
        description?: string;
        symbol?: string;
        uniprotId?: string;
        keggId?: string;
        pubmedIds?: string[];
        expression?: number;
        concentration?: number;
        activity?: 'active' | 'inactive' | 'unknown';
        color?: string;
        size?: number;
        metadata?: any;
    };
    position: { x: number; y: number };
    style?: any;
}

interface PathwayEdge {
    id: string;
    source: string;
    target: string;
    type: 'activation' | 'inhibition' | 'binding' | 'catalysis' | 'transcription' | 'translation' | 'metabolism';
    data: {
        label?: string;
        strength?: number;
        evidence?: string;
        references?: string[];
        reversible?: boolean;
        color?: string;
        width?: number;
    };
    animated?: boolean;
    style?: any;
}

interface Pathway {
    id: string;
    name: string;
    description: string;
    version: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    nodes: PathwayNode[];
    edges: PathwayEdge[];
    metadata: {
        organism?: string;
        tissue?: string;
        disease?: string;
        keywords?: string[];
        references?: string[];
    };
}

// Custom Node Components
const GeneNode: React.FC<{ data: any }> = ({ data }) => (
    <div style={{ 
        padding: '10px', 
        borderRadius: '8px', 
        backgroundColor: data.color || '#e3f2fd',
        border: '2px solid #1976d2',
        minWidth: '120px',
        textAlign: 'center'
    }}>
        <Handle type="target" position={Position.Top} />
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {data.symbol || data.label}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
            {data.label}
        </div>
        {data.expression !== undefined && (
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
                Expression: {data.expression}
            </div>
        )}
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const ProteinNode: React.FC<{ data: any }> = ({ data }) => (
    <div style={{ 
        padding: '10px', 
        borderRadius: '8px', 
        backgroundColor: data.color || '#f3e5f5',
        border: '2px solid #7b1fa2',
        minWidth: '120px',
        textAlign: 'center'
    }}>
        <Handle type="target" position={Position.Top} />
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {data.symbol || data.label}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
            {data.label}
        </div>
        {data.activity && (
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
                Activity: {data.activity}
            </div>
        )}
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const MetaboliteNode: React.FC<{ data: any }> = ({ data }) => (
    <div style={{ 
        padding: '10px', 
        borderRadius: '50%', 
        backgroundColor: data.color || '#e8f5e8',
        border: '2px solid #388e3c',
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    }}>
        <Handle type="target" position={Position.Top} />
        <div>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                {data.symbol || data.label}
            </div>
            {data.concentration !== undefined && (
                <div style={{ fontSize: '10px', marginTop: '2px' }}>
                    {data.concentration} μM
                </div>
            )}
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const ReactionNode: React.FC<{ data: any }> = ({ data }) => (
    <div style={{ 
        padding: '8px', 
        borderRadius: '4px', 
        backgroundColor: data.color || '#fff3e0',
        border: '2px solid #f57c00',
        minWidth: '100px',
        textAlign: 'center',
        transform: 'rotate(45deg)'
    }}>
        <Handle type="target" position={Position.Top} />
        <div style={{ transform: 'rotate(-45deg)', fontSize: '12px' }}>
            {data.label}
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const nodeTypes = {
    gene: GeneNode,
    protein: ProteinNode,
    metabolite: MetaboliteNode,
    reaction: ReactionNode
};

const VisualPathwayEditor: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
    const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
    const [pathwayDialogOpen, setPathwayDialogOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [pathway, setPathway] = useState<Pathway>({
        id: `pathway-${Date.now()}`,
        name: 'New Pathway',
        description: '',
        version: '1.0',
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [],
        edges: [],
        metadata: {}
    });

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { project } = useReactFlow();

    const [newNode, setNewNode] = useState({
        type: 'gene' as PathwayNode['type'],
        label: '',
        symbol: '',
        description: '',
        color: '#e3f2fd',
        expression: undefined as number | undefined,
        activity: 'unknown' as 'active' | 'inactive' | 'unknown',
        concentration: undefined as number | undefined
    });

    const [newEdge, setNewEdge] = useState({
        type: 'activation' as PathwayEdge['type'],
        label: '',
        strength: 1,
        evidence: '',
        reversible: false,
        color: '#666'
    });

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) => addEdge(params, eds));
        },
        [setEdges]
    );

    const onNodeClick = useCallback((event: any, node: Node) => {
        setSelectedNode(node);
        setNewNode({
            type: node.data.type || 'gene',
            label: node.data.label || '',
            symbol: node.data.symbol || '',
            description: node.data.description || '',
            color: node.data.color || '#e3f2fd',
            expression: node.data.expression,
            activity: node.data.activity || 'unknown',
            concentration: node.data.concentration
        });
        setNodeDialogOpen(true);
    }, []);

    const onEdgeClick = useCallback((event: any, edge: Edge) => {
        setSelectedEdge(edge);
        setNewEdge({
            type: edge.data?.type || 'activation',
            label: edge.data?.label || '',
            strength: edge.data?.strength || 1,
            evidence: edge.data?.evidence || '',
            reversible: edge.data?.reversible || false,
            color: edge.data?.color || '#666'
        });
        setEdgeDialogOpen(true);
    }, []);

    const addNode = () => {
        const newNodeId = `node-${Date.now()}`;
        const newNode: Node = {
            id: newNodeId,
            type: newNode.type,
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            data: {
                label: newNode.label,
                symbol: newNode.symbol,
                description: newNode.description,
                color: newNode.color,
                expression: newNode.expression,
                activity: newNode.activity,
                concentration: newNode.concentration,
                type: newNode.type
            }
        };
        setNodes((nds) => [...nds, newNode]);
        setNodeDialogOpen(false);
        setNewNode({
            type: 'gene',
            label: '',
            symbol: '',
            description: '',
            color: '#e3f2fd',
            expression: undefined,
            activity: 'unknown',
            concentration: undefined
        });
    };

    const updateNode = () => {
        if (!selectedNode) return;
        
        setNodes((nds) =>
            nds.map((node) =>
                node.id === selectedNode.id
                    ? {
                          ...node,
                          data: {
                              ...node.data,
                              label: newNode.label,
                              symbol: newNode.symbol,
                              description: newNode.description,
                              color: newNode.color,
                              expression: newNode.expression,
                              activity: newNode.activity,
                              concentration: newNode.concentration
                          }
                      }
                    : node
            )
        );
        setNodeDialogOpen(false);
        setSelectedNode(null);
    };

    const addEdge = () => {
        if (!selectedNode) return;
        
        const newEdgeId = `edge-${Date.now()}`;
        const newEdge: Edge = {
            id: newEdgeId,
            source: selectedNode.id,
            target: `node-${Date.now() + 1}`, // This would be the target node
            type: 'smoothstep',
            data: {
                type: newEdge.type,
                label: newEdge.label,
                strength: newEdge.strength,
                evidence: newEdge.evidence,
                reversible: newEdge.reversible,
                color: newEdge.color
            },
            style: { stroke: newEdge.color, strokeWidth: newEdge.strength * 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: newEdge.color
            }
        };
        setEdges((eds) => [...eds, newEdge]);
        setEdgeDialogOpen(false);
    };

    const deleteSelected = () => {
        if (selectedNode) {
            setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
            setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
            setSelectedNode(null);
        }
        if (selectedEdge) {
            setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
            setSelectedEdge(null);
        }
    };

    const savePathway = () => {
        const updatedPathway: Pathway = {
            ...pathway,
            nodes: nodes.map(node => ({
                id: node.id,
                type: node.data.type || 'gene',
                data: node.data,
                position: node.position,
                style: node.style
            })),
            edges: edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: edge.data?.type || 'activation',
                data: edge.data || {},
                animated: edge.animated,
                style: edge.style
            })),
            updatedAt: new Date().toISOString()
        };
        setPathway(updatedPathway);
        // In real app, save to backend
        console.log('Saving pathway:', updatedPathway);
    };

    const getNodeColor = (type: string) => {
        const colors = {
            gene: '#e3f2fd',
            protein: '#f3e5f5',
            metabolite: '#e8f5e8',
            reaction: '#fff3e0',
            pathway: '#fce4ec',
            disease: '#ffebee',
            drug: '#e0f2f1'
        };
        return colors[type as keyof typeof colors] || '#f5f5f5';
    };

    const getNodeIcon = (type: string) => {
        const icons = {
            gene: <ScienceIcon />,
            protein: <BiotechIcon />,
            metabolite: <WaterDropIcon />,
            reaction: <TimelineIcon />,
            pathway: <AccountTreeIcon />,
            disease: <LocalHospitalIcon />,
            drug: <LocalHospitalIcon />
        };
        return icons[type as keyof typeof icons] || <ScienceIcon />;
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex' }}>
            {/* Sidebar */}
            <Drawer
                variant="persistent"
                anchor="left"
                open={sidebarOpen}
                sx={{
                    width: 300,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 300,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Pathway Editor
                    </Typography>
                    
                    <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                        <Tab label="Elements" />
                        <Tab label="Properties" />
                        <Tab label="Pathway" />
                    </Tabs>

                    {activeTab === 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Add Elements
                            </Typography>
                            <List>
                                {['gene', 'protein', 'metabolite', 'reaction', 'pathway', 'disease', 'drug'].map((type) => (
                                    <ListItem key={type} button onClick={() => {
                                        setNewNode(prev => ({ ...prev, type: type as any }));
                                        setNodeDialogOpen(true);
                                    }}>
                                        <ListItemIcon>
                                            {getNodeIcon(type)}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={type.charAt(0).toUpperCase() + type.slice(1)}
                                            secondary={`Add ${type} to pathway`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Properties
                            </Typography>
                            {selectedNode && (
                                <Card sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle2">
                                            Selected Node: {selectedNode.data.label}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Type: {selectedNode.data.type}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditIcon />}
                                                onClick={() => setNodeDialogOpen(true)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={deleteSelected}
                                                sx={{ ml: 1 }}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}
                            {selectedEdge && (
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2">
                                            Selected Edge: {selectedEdge.data?.label || 'Connection'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Type: {selectedEdge.data?.type}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditIcon />}
                                                onClick={() => setEdgeDialogOpen(true)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={deleteSelected}
                                                sx={{ ml: 1 }}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Pathway Info
                            </Typography>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle2">
                                        {pathway.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {pathway.description}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Version: {pathway.version}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Nodes: {nodes.length}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Edges: {edges.length}
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            onClick={savePathway}
                                        >
                                            Save Pathway
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Box>
            </Drawer>

            {/* Main Canvas */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <AppBar position="static" color="default" elevation={1}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <SettingsIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {pathway.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Undo">
                                <IconButton>
                                    <UndoIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Redo">
                                <IconButton>
                                    <RedoIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Zoom In">
                                <IconButton>
                                    <ZoomInIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Zoom Out">
                                <IconButton>
                                    <ZoomOutIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Fit to Screen">
                                <IconButton>
                                    <FitScreenIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Save">
                                <IconButton onClick={savePathway}>
                                    <SaveIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Box ref={reactFlowWrapper} sx={{ flexGrow: 1 }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onEdgeClick={onEdgeClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Controls />
                        <Background />
                        <MiniMap />
                        <Panel position="top-right">
                            <Card>
                                <CardContent sx={{ p: 1 }}>
                                    <Typography variant="caption">
                                        Nodes: {nodes.length} | Edges: {edges.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Panel>
                    </ReactFlow>
                </Box>
            </Box>

            {/* Node Dialog */}
            <Dialog open={nodeDialogOpen} onClose={() => setNodeDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedNode ? 'Edit Node' : 'Add Node'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={newNode.type}
                                    onChange={(e) => setNewNode(prev => ({ ...prev, type: e.target.value as any }))}
                                >
                                    <MenuItem value="gene">Gene</MenuItem>
                                    <MenuItem value="protein">Protein</MenuItem>
                                    <MenuItem value="metabolite">Metabolite</MenuItem>
                                    <MenuItem value="reaction">Reaction</MenuItem>
                                    <MenuItem value="pathway">Pathway</MenuItem>
                                    <MenuItem value="disease">Disease</MenuItem>
                                    <MenuItem value="drug">Drug</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Label"
                                value={newNode.label}
                                onChange={(e) => setNewNode(prev => ({ ...prev, label: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Symbol"
                                value={newNode.symbol}
                                onChange={(e) => setNewNode(prev => ({ ...prev, symbol: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description"
                                value={newNode.description}
                                onChange={(e) => setNewNode(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </Grid>
                        {newNode.type === 'gene' && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Expression Level"
                                    value={newNode.expression || ''}
                                    onChange={(e) => setNewNode(prev => ({ ...prev, expression: e.target.value ? Number(e.target.value) : undefined }))}
                                />
                            </Grid>
                        )}
                        {newNode.type === 'protein' && (
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Activity</InputLabel>
                                    <Select
                                        value={newNode.activity}
                                        onChange={(e) => setNewNode(prev => ({ ...prev, activity: e.target.value as any }))}
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                        <MenuItem value="unknown">Unknown</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        {newNode.type === 'metabolite' && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Concentration (μM)"
                                    value={newNode.concentration || ''}
                                    onChange={(e) => setNewNode(prev => ({ ...prev, concentration: e.target.value ? Number(e.target.value) : undefined }))}
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNodeDialogOpen(false)}>Cancel</Button>
                    <Button onClick={selectedNode ? updateNode : addNode} variant="contained">
                        {selectedNode ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edge Dialog */}
            <Dialog open={edgeDialogOpen} onClose={() => setEdgeDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedEdge ? 'Edit Edge' : 'Add Edge'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={newEdge.type}
                                    onChange={(e) => setNewEdge(prev => ({ ...prev, type: e.target.value as any }))}
                                >
                                    <MenuItem value="activation">Activation</MenuItem>
                                    <MenuItem value="inhibition">Inhibition</MenuItem>
                                    <MenuItem value="binding">Binding</MenuItem>
                                    <MenuItem value="catalysis">Catalysis</MenuItem>
                                    <MenuItem value="transcription">Transcription</MenuItem>
                                    <MenuItem value="translation">Translation</MenuItem>
                                    <MenuItem value="metabolism">Metabolism</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Label"
                                value={newEdge.label}
                                onChange={(e) => setNewEdge(prev => ({ ...prev, label: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Strength"
                                value={newEdge.strength}
                                onChange={(e) => setNewEdge(prev => ({ ...prev, strength: Number(e.target.value) }))}
                                inputProps={{ min: 0, max: 10, step: 0.1 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Evidence"
                                value={newEdge.evidence}
                                onChange={(e) => setNewEdge(prev => ({ ...prev, evidence: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={newEdge.reversible}
                                        onChange={(e) => setNewEdge(prev => ({ ...prev, reversible: e.target.checked }))}
                                    />
                                }
                                label="Reversible"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEdgeDialogOpen(false)}>Cancel</Button>
                    <Button onClick={addEdge} variant="contained">
                        {selectedEdge ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Wrap with ReactFlowProvider
const VisualPathwayEditorWithProvider: React.FC = () => (
    <ReactFlowProvider>
        <VisualPathwayEditor />
    </ReactFlowProvider>
);

export default VisualPathwayEditorWithProvider; 