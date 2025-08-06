import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert
} from '@mui/material';
import {
  Note as NoteIcon,
  Science as ProtocolIcon,
  Assignment as TaskIcon,
  Storage as DatabaseIcon,
  Brush as DrawingIcon
} from '@mui/icons-material';

// Import our drawing insertion components
import DrawingInsertionToolbar from '../components/DrawingInsertionToolbar';
import { useDrawingInsertion } from '../hooks/useDrawingInsertion';
import { DrawingData } from '../components/blocks/FreeformDrawingBlock';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`drawing-demo-tabpanel-${index}`}
      aria-labelledby={`drawing-demo-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DrawingInsertionDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [content, setContent] = useState({
    note: '',
    project: '',
    protocol: '',
    task: '',
    database: ''
  });
  const [insertedDrawings, setInsertedDrawings] = useState<Record<string, DrawingData[]>>({
    note: [],
    project: [],
    protocol: [],
    task: [],
    database: []
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const createDrawingHandler = (entityType: keyof typeof content) => {
    return async (drawingData: DrawingData, blockId: string) => {
      // Add drawing to the list
      setInsertedDrawings(prev => ({
        ...prev,
        [entityType]: [...(prev[entityType] || []), drawingData]
      }));

      // Add drawing reference to content
      const drawingBlock = `\n\n\`\`\`freeform-drawing
Block ID: ${blockId}
Entity Type: ${entityType}
Created: ${new Date().toLocaleString()}
\`\`\`\n\n`;

      setContent(prev => ({
        ...prev,
        [entityType]: prev[entityType] + drawingBlock
      }));
    };
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'note': return 'Note';
      case 'project': return 'Project';
      case 'protocol': return 'Protocol';
      case 'task': return 'Task';
      case 'database': return 'Database Entry';
      default: return type;
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'note': return '#4CAF50';
      case 'project': return '#2196F3';
      case 'protocol': return '#FF9800';
      case 'task': return '#9C27B0';
      case 'database': return '#607D8B';
      default: return '#666';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        <DrawingIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Drawing Insertion Demo
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        This demo showcases the drawing insertion functionality across all entity editors. 
        Click the "Add Drawing" button in any editor to create and insert a freeform drawing.
      </Alert>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="drawing insertion demo tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<NoteIcon />} 
              label="Notes" 
              iconPosition="start"
              sx={{ color: getEntityTypeColor('note') }}
            />
            <Tab 
              icon={<ProtocolIcon />} 
              label="Projects" 
              iconPosition="start"
              sx={{ color: getEntityTypeColor('project') }}
            />
            <Tab 
              icon={<ProtocolIcon />} 
              label="Protocols" 
              iconPosition="start"
              sx={{ color: getEntityTypeColor('protocol') }}
            />
            <Tab 
              icon={<TaskIcon />} 
              label="Tasks" 
              iconPosition="start"
              sx={{ color: getEntityTypeColor('task') }}
            />
            <Tab 
              icon={<DatabaseIcon />} 
              label="Database" 
              iconPosition="start"
              sx={{ color: getEntityTypeColor('database') }}
            />
          </Tabs>
        </Box>

        {/* Notes Editor Demo */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader 
                  title="Note Editor"
                  action={
                    <DrawingInsertionToolbar
                      entityId="demo-note-1"
                      entityType="note"
                      onInsertDrawing={createDrawingHandler('note')}
                      variant="button"
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This simulates the Notes editor with drawing insertion capability.
                  </Typography>
                  <Box
                    component="textarea"
                    sx={{
                      width: '100%',
                      minHeight: 200,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    value={content.note}
                    onChange={(e) => setContent(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Type your note content here... Use the Add Drawing button to insert drawings."
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Inserted Drawings" />
                <CardContent>
                  {insertedDrawings.note.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No drawings inserted yet.
                    </Typography>
                  ) : (
                    insertedDrawings.note.map((drawing, index) => (
                      <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Drawing {index + 1}
                        </Typography>
                        <Typography variant="body2">
                          Strokes: {drawing.strokes.length}
                        </Typography>
                        <Typography variant="body2">
                          Size: {drawing.width} × {drawing.height}
                        </Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Projects Editor Demo */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader 
                  title="Project Editor"
                  action={
                    <DrawingInsertionToolbar
                      entityId="demo-project-1"
                      entityType="project"
                      onInsertDrawing={createDrawingHandler('project')}
                      variant="button"
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This simulates the Projects editor with drawing insertion capability.
                  </Typography>
                  <Box
                    component="textarea"
                    sx={{
                      width: '100%',
                      minHeight: 200,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    value={content.project}
                    onChange={(e) => setContent(prev => ({ ...prev, project: e.target.value }))}
                    placeholder="Type your project description here... Use the Add Drawing button to insert drawings."
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Inserted Drawings" />
                <CardContent>
                  {insertedDrawings.project.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No drawings inserted yet.
                    </Typography>
                  ) : (
                    insertedDrawings.project.map((drawing, index) => (
                      <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Drawing {index + 1}
                        </Typography>
                        <Typography variant="body2">
                          Strokes: {drawing.strokes.length}
                        </Typography>
                        <Typography variant="body2">
                          Size: {drawing.width} × {drawing.height}
                        </Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Protocols Editor Demo */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader 
                  title="Protocol Editor"
                  action={
                    <DrawingInsertionToolbar
                      entityId="demo-protocol-1"
                      entityType="protocol"
                      onInsertDrawing={createDrawingHandler('protocol')}
                      variant="button"
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This simulates the Protocols editor with drawing insertion capability.
                  </Typography>
                  <Box
                    component="textarea"
                    sx={{
                      width: '100%',
                      minHeight: 200,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    value={content.protocol}
                    onChange={(e) => setContent(prev => ({ ...prev, protocol: e.target.value }))}
                    placeholder="Type your protocol description here... Use the Add Drawing button to insert drawings."
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Inserted Drawings" />
                <CardContent>
                  {insertedDrawings.protocol.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No drawings inserted yet.
                    </Typography>
                  ) : (
                    insertedDrawings.protocol.map((drawing, index) => (
                      <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Drawing {index + 1}
                        </Typography>
                        <Typography variant="body2">
                          Strokes: {drawing.strokes.length}
                        </Typography>
                        <Typography variant="body2">
                          Size: {drawing.width} × {drawing.height}
                        </Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tasks Editor Demo */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader 
                  title="Task Editor"
                  action={
                    <DrawingInsertionToolbar
                      entityId="demo-task-1"
                      entityType="task"
                      onInsertDrawing={createDrawingHandler('task')}
                      variant="button"
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This simulates the Tasks editor with drawing insertion capability.
                  </Typography>
                  <Box
                    component="textarea"
                    sx={{
                      width: '100%',
                      minHeight: 200,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    value={content.task}
                    onChange={(e) => setContent(prev => ({ ...prev, task: e.target.value }))}
                    placeholder="Type your task description here... Use the Add Drawing button to insert drawings."
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Inserted Drawings" />
                <CardContent>
                  {insertedDrawings.task.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No drawings inserted yet.
                    </Typography>
                  ) : (
                    insertedDrawings.task.map((drawing, index) => (
                      <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Drawing {index + 1}
                        </Typography>
                        <Typography variant="body2">
                          Strokes: {drawing.strokes.length}
                        </Typography>
                        <Typography variant="body2">
                          Size: {drawing.width} × {drawing.height}
                        </Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Database Editor Demo */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader 
                  title="Database Entry Editor"
                  action={
                    <DrawingInsertionToolbar
                      entityId="demo-database-1"
                      entityType="database"
                      onInsertDrawing={createDrawingHandler('database')}
                      variant="button"
                    />
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    This simulates the Database Entry editor with drawing insertion capability.
                  </Typography>
                  <Box
                    component="textarea"
                    sx={{
                      width: '100%',
                      minHeight: 200,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                    value={content.database}
                    onChange={(e) => setContent(prev => ({ ...prev, database: e.target.value }))}
                    placeholder="Type your database entry description here... Use the Add Drawing button to insert drawings."
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Inserted Drawings" />
                <CardContent>
                  {insertedDrawings.database.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No drawings inserted yet.
                    </Typography>
                  ) : (
                    insertedDrawings.database.map((drawing, index) => (
                      <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Drawing {index + 1}
                        </Typography>
                        <Typography variant="body2">
                          Strokes: {drawing.strokes.length}
                        </Typography>
                        <Typography variant="body2">
                          Size: {drawing.width} × {drawing.height}
                        </Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Features Demonstrated
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              ✅ Universal Drawing Insertion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drawing insertion works consistently across all entity types: Notes, Projects, Protocols, Tasks, and Database Entries.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              ✅ Context-Aware Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Each editor maintains its own drawing context and content, with proper entity type identification.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              ✅ Backend Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drawings are automatically saved to the backend with proper polymorphic relationships.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              ✅ Content Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Drawing blocks are inserted into content with proper formatting and metadata preservation.
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default DrawingInsertionDemo; 