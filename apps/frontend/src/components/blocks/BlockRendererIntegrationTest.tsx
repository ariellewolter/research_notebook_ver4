import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  Alert
} from '@mui/material';
import { BlockRenderer } from '../NotionWorkspace/components/BlockRenderer';
import { Block } from '../NotionWorkspace/types';
import { DrawingData } from './FreeformDrawingBlock';

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
      id={`block-renderer-test-tabpanel-${index}`}
      aria-labelledby={`block-renderer-test-tab-${index}`}
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

const BlockRendererIntegrationTest: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [blocks, setBlocks] = useState<Record<string, Block[]>>({
    note: [
      {
        id: 'note-text-1',
        type: 'text',
        content: 'This is a research note with a drawing block below.',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'note-drawing-1',
        type: 'freeform-drawing',
        content: 'note',
        entityId: 'note-1',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          drawingData: null
        }
      }
    ],
    project: [
      {
        id: 'project-text-1',
        type: 'text',
        content: 'Project planning with diagram support.',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'project-drawing-1',
        type: 'freeform-drawing',
        content: 'project',
        entityId: 'project-1',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          drawingData: null
        }
      }
    ],
    protocol: [
      {
        id: 'protocol-text-1',
        type: 'text',
        content: 'Experimental protocol with visual diagrams.',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'protocol-drawing-1',
        type: 'freeform-drawing',
        content: 'protocol',
        entityId: 'protocol-1',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          drawingData: null
        }
      }
    ],
    task: [
      {
        id: 'task-text-1',
        type: 'text',
        content: 'Task management with sketching capabilities.',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'task-drawing-1',
        type: 'freeform-drawing',
        content: 'task',
        entityId: 'task-1',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          drawingData: null
        }
      }
    ],
    database: [
      {
        id: 'database-text-1',
        type: 'text',
        content: 'Database entry with annotation support.',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'database-drawing-1',
        type: 'freeform-drawing',
        content: 'database',
        entityId: 'database-1',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          drawingData: null
        }
      }
    ]
  });

  const entityTypes = [
    { type: 'note', label: 'Notes', description: 'Research notes and observations' },
    { type: 'project', label: 'Projects', description: 'Project planning and diagrams' },
    { type: 'protocol', label: 'Protocols', description: 'Experimental procedures and flowcharts' },
    { type: 'task', label: 'Tasks', description: 'Task planning and sketches' },
    { type: 'database', label: 'Database Entries', description: 'Data visualization and annotations' }
  ] as const;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBlockContentChange = (blockId: string, content: string) => {
    const entityType = entityTypes[tabValue].type;
    setBlocks(prev => ({
      ...prev,
      [entityType]: prev[entityType].map(block => 
        block.id === blockId 
          ? { ...block, content, updatedAt: new Date() }
          : block
      )
    }));
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    console.log('Drag start:', blockId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, blockId: string) => {
    console.log('Drop:', blockId);
  };

  const handleDragEnd = () => {
    console.log('Drag end');
  };

  const handleContextMenuOpen = (e: React.MouseEvent, blockId: string) => {
    console.log('Context menu:', blockId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, block: Block) => {
    console.log('Key down:', block.id);
  };

  const handleHeadingKeyDown = (e: React.KeyboardEvent<HTMLElement>, block: Block) => {
    console.log('Heading key down:', block.id);
  };

  const handleAddTableRow = (blockId: string) => {
    console.log('Add table row:', blockId);
  };

  const handleAddTableColumn = (blockId: string) => {
    console.log('Add table column:', blockId);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          BlockRenderer Integration Test
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This test demonstrates how the BlockRenderer handles freeform-drawing blocks across different entity types.
          Each tab shows a different context where drawing blocks can be embedded.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          The BlockRenderer now supports freeform-drawing blocks that can be embedded in any entity type.
          Drawing data is automatically saved and restored when the block is rendered.
        </Alert>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="block renderer test tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {entityTypes.map((entity, index) => (
              <Tab 
                key={entity.type}
                label={entity.label}
                id={`block-renderer-test-tab-${index}`}
                aria-controls={`block-renderer-test-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {entityTypes.map((entity, index) => (
          <TabPanel key={entity.type} value={tabValue} index={index}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {entity.label} Blocks
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {entity.description}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              {blocks[entity.type].map((block) => (
                <Box key={block.id} sx={{ mb: 2 }}>
                  <BlockRenderer
                    block={block}
                    draggedBlockId={null}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onContextMenuOpen={handleContextMenuOpen}
                    onBlockContentChange={handleBlockContentChange}
                    onKeyDown={handleKeyDown}
                    onHeadingKeyDown={handleHeadingKeyDown}
                    onAddTableRow={handleAddTableRow}
                    onAddTableColumn={handleAddTableColumn}
                  />
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Integration Features
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Drawing blocks are fully integrated with the block system</li>
                <li>Drag and drop support for reordering blocks</li>
                <li>Context menu support for block operations</li>
                <li>Automatic saving of drawing data</li>
                <li>Responsive layout across all entity types</li>
                <li>Consistent styling with other block types</li>
              </Box>
            </Box>
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default BlockRendererIntegrationTest; 