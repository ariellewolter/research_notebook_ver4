import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import FreeformDrawingBlock, { DrawingData } from './FreeformDrawingBlock';

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

const FreeformDrawingBlockDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [savedDrawings, setSavedDrawings] = useState<Record<string, DrawingData>>({});
  const [lastSaved, setLastSaved] = useState<string>('');

  const entityTypes = [
    { type: 'note', label: 'Notes', description: 'Research notes and observations' },
    { type: 'project', label: 'Projects', description: 'Project planning and diagrams' },
    { type: 'protocol', label: 'Protocols', description: 'Experimental procedures and flowcharts' },
    { type: 'task', label: 'Tasks', description: 'Task planning and sketches' },
    { type: 'database', label: 'Database Entries', description: 'Data visualization and annotations' }
  ] as const;

  const handleSave = async (entityType: string, blockId: string, data: DrawingData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSavedDrawings(prev => ({
        ...prev,
        [blockId]: data
      }));
      
      setLastSaved(`${entityType} - ${new Date().toLocaleTimeString()}`);
      
      console.log(`Saved drawing for ${entityType}:`, data);
    } catch (error) {
      console.error('Failed to save drawing:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Universal FreeformDrawingBlock Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This demo showcases how the FreeformDrawingBlock component can be embedded across different entity types.
          Each tab represents a different context where drawing functionality might be useful.
        </Typography>
        
        {lastSaved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Last saved: {lastSaved}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="drawing block demo tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {entityTypes.map((entity, index) => (
              <Tab 
                key={entity.type}
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body2">{entity.label}</Typography>
                    <Chip 
                      label={entity.type} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                }
                id={`drawing-demo-tab-${index}`}
                aria-controls={`drawing-demo-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {entityTypes.map((entity, index) => (
          <TabPanel key={entity.type} value={tabValue} index={index}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {entity.label} Drawing Block
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {entity.description}
              </Typography>
              
              {savedDrawings[`${entity.type}-demo`] && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This drawing has been saved with {savedDrawings[`${entity.type}-demo`].strokes.length} strokes.
                  SVG and PNG formats are available for download.
                </Alert>
              )}
            </Box>

            <FreeformDrawingBlock
              blockId={`${entity.type}-demo`}
              entityId={`demo-${entity.type}-1`}
              entityType={entity.type}
              onSave={(data) => handleSave(entity.type, `${entity.type}-demo`, data)}
              initialData={savedDrawings[`${entity.type}-demo`]}
              width={800}
              height={500}
            />

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Use Cases for {entity.label}
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {entity.type === 'note' && (
                  <>
                    <li>Sketching research ideas and concepts</li>
                    <li>Drawing diagrams for notes</li>
                    <li>Creating visual annotations</li>
                    <li>Hand-drawn equations and formulas</li>
                  </>
                )}
                {entity.type === 'project' && (
                  <>
                    <li>Project timeline diagrams</li>
                    <li>Workflow sketches</li>
                    <li>Architecture diagrams</li>
                    <li>Mind maps and brainstorming</li>
                  </>
                )}
                {entity.type === 'protocol' && (
                  <>
                    <li>Experimental setup diagrams</li>
                    <li>Procedure flowcharts</li>
                    <li>Equipment sketches</li>
                    <li>Safety procedure illustrations</li>
                  </>
                )}
                {entity.type === 'task' && (
                  <>
                    <li>Task breakdown diagrams</li>
                    <li>Progress tracking sketches</li>
                    <li>Quick notes and reminders</li>
                    <li>Process flow diagrams</li>
                  </>
                )}
                {entity.type === 'database' && (
                  <>
                    <li>Data visualization sketches</li>
                    <li>Schema diagrams</li>
                    <li>Annotation of data points</li>
                    <li>Relationship mapping</li>
                  </>
                )}
              </Box>
            </Box>
          </TabPanel>
        ))}
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Component Features
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li><strong>Universal Embedding:</strong> Works across Notes, Projects, Protocols, Tasks, and Database Entries</li>
          <li><strong>Touch & Mouse Support:</strong> Full support for both touch devices and mouse input</li>
          <li><strong>Vector & Raster Export:</strong> Saves drawings as SVG paths and PNG thumbnails</li>
          <li><strong>Undo/Redo:</strong> Complete stroke history management</li>
          <li><strong>Brush Customization:</strong> Multiple colors and brush sizes</li>
          <li><strong>Pressure Sensitivity:</strong> Supports pressure-sensitive input devices</li>
          <li><strong>Responsive Design:</strong> Adapts to container size and device pixel ratio</li>
          <li><strong>Read-only Mode:</strong> Can be displayed in read-only mode for viewing</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default FreeformDrawingBlockDemo; 