import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { BlockRendererIntegrationTest } from '../components/blocks';

const BlockRendererTest: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          BlockRenderer Integration Test
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Test the BlockRenderer's ability to handle freeform-drawing blocks across different entity types.
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            1. Switch between tabs to see drawing blocks in different contexts
          </Typography>
          <Typography variant="body2" paragraph>
            2. Try drawing in each context to see how data is saved
          </Typography>
          <Typography variant="body2" paragraph>
            3. Test the drag and drop functionality
          </Typography>
          <Typography variant="body2" paragraph>
            4. Verify that drawing data persists across entity types
          </Typography>
        </Paper>

        <BlockRendererIntegrationTest />
      </Box>
    </Container>
  );
};

export default BlockRendererTest; 