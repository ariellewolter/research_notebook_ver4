import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { FreeformDrawingBlockDemo } from '../components/blocks';

const FreeformDrawingBlockTest: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          FreeformDrawingBlock Test Page
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Test the universal drawing block component across different entity types.
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            1. Switch between tabs to see the drawing block in different contexts
          </Typography>
          <Typography variant="body2" paragraph>
            2. Try drawing with both mouse and touch input
          </Typography>
          <Typography variant="body2" paragraph>
            3. Test the undo/redo functionality
          </Typography>
          <Typography variant="body2" paragraph>
            4. Change colors and brush sizes
          </Typography>
          <Typography variant="body2" paragraph>
            5. Save drawings and download as SVG/PNG
          </Typography>
        </Paper>

        <FreeformDrawingBlockDemo />
      </Box>
    </Container>
  );
};

export default FreeformDrawingBlockTest; 