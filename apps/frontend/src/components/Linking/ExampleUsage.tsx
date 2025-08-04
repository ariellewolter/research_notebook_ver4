import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  ProtocolLinkingComponent,
  RecipeLinkingComponent,
  PDFLinkingComponent,
  NoteLinkingComponent,
  DatabaseEntryLinkingComponent
} from './index';

// Example: How to replace the current linking logic in ProjectForm
export const ProjectLinkingExample: React.FC<{ projectId: string }> = ({ projectId }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Project Linking (New Reusable Components)
      </Typography>
      
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Notes Linking */}
        <Paper elevation={1}>
          <NoteLinkingComponent
            sourceType="project"
            sourceId={projectId}
            title="Project Notes"
            maxHeight="250px"
            onLinkChange={(linkedNotes) => {
              console.log('Notes updated:', linkedNotes);
            }}
          />
        </Paper>

        {/* Database Entries Linking */}
        <Paper elevation={1}>
          <DatabaseEntryLinkingComponent
            sourceType="project"
            sourceId={projectId}
            title="Project Database Entries"
            maxHeight="250px"
            onLinkChange={(linkedEntries) => {
              console.log('Database entries updated:', linkedEntries);
            }}
          />
        </Paper>

        {/* Protocols Linking */}
        <Paper elevation={1}>
          <ProtocolLinkingComponent
            sourceType="project"
            sourceId={projectId}
            title="Project Protocols"
            maxHeight="250px"
            onLinkChange={(linkedProtocols) => {
              console.log('Protocols updated:', linkedProtocols);
            }}
          />
        </Paper>

        {/* Recipes Linking */}
        <Paper elevation={1}>
          <RecipeLinkingComponent
            sourceType="project"
            sourceId={projectId}
            title="Project Recipes"
            maxHeight="250px"
            onLinkChange={(linkedRecipes) => {
              console.log('Recipes updated:', linkedRecipes);
            }}
          />
        </Paper>

        {/* PDFs Linking */}
        <Paper elevation={1}>
          <PDFLinkingComponent
            sourceType="project"
            sourceId={projectId}
            title="Project Documents"
            maxHeight="250px"
            onLinkChange={(linkedPDFs) => {
              console.log('PDFs updated:', linkedPDFs);
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

// Example: Custom entity rendering for protocols
export const CustomProtocolLinkingExample: React.FC<{ projectId: string }> = ({ projectId }) => {
  return (
    <ProtocolLinkingComponent
      sourceType="project"
      sourceId={projectId}
      title="Custom Protocol Display"
      renderEntity={(protocol, isLinked) => (
        <Box sx={{ 
          p: 1, 
          border: '1px solid', 
          borderColor: isLinked ? 'primary.main' : 'grey.300',
          borderRadius: 1,
          mb: 1,
          backgroundColor: isLinked ? 'primary.50' : 'background.paper'
        }}>
          <Typography variant="subtitle2" color="primary">
            {protocol.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {protocol.description || 'No description'}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Category: {protocol.category || 'Uncategorized'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Steps: {protocol.steps?.length || 0}
            </Typography>
          </Box>
        </Box>
      )}
    />
  );
};

// Example: Experiment linking with multiple entity types
export const ExperimentLinkingExample: React.FC<{ experimentId: string }> = ({ experimentId }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Experiment Setup
      </Typography>
      
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <ProtocolLinkingComponent
          sourceType="experiment"
          sourceId={experimentId}
          title="Experiment Protocols"
          showCreateButton={true}
        />
        
        <RecipeLinkingComponent
          sourceType="experiment"
          sourceId={experimentId}
          title="Experiment Recipes"
          showCreateButton={true}
        />
        
        <PDFLinkingComponent
          sourceType="experiment"
          sourceId={experimentId}
          title="Experiment Documents"
          showCreateButton={false}
        />
      </Box>
    </Box>
  );
};

// Example: Note linking with projects and tasks
export const NoteLinkingExample: React.FC<{ noteId: string }> = ({ noteId }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Note Organization
      </Typography>
      
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <ProjectLinkingComponent
          sourceType="note"
          sourceId={noteId}
          title="Related Projects"
        />
        
        <TaskLinkingComponent
          sourceType="note"
          sourceId={noteId}
          title="Related Tasks"
        />
      </Box>
    </Box>
  );
};

// Example: Compact linking for sidebar or smaller spaces
export const CompactLinkingExample: React.FC<{ projectId: string }> = ({ projectId }) => {
  return (
    <Box sx={{ width: 280 }}>
      <Typography variant="subtitle2" gutterBottom>
        Quick Links
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ProtocolLinkingComponent
          sourceType="project"
          sourceId={projectId}
          title="Protocols"
          maxHeight="150px"
          showSearch={false}
        />
        
        <RecipeLinkingComponent
          sourceType="project"
          sourceId={projectId}
          title="Recipes"
          maxHeight="150px"
          showSearch={false}
        />
      </Box>
    </Box>
  );
}; 