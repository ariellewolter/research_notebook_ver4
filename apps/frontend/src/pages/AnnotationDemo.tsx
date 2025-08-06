import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Alert
} from '@mui/material';
import {
  TextFields as TextFieldsIcon
} from '@mui/icons-material';
import FreeformDrawingBlock from '../components/blocks/FreeformDrawingBlock';
import { DrawingData } from '../components/blocks/FreeformDrawingBlock';

const AnnotationDemo: React.FC = () => {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);

  const handleSave = (drawingData: DrawingData) => {
    setSavedDrawings(prev => [...prev, drawingData]);
    console.log('Drawing saved with annotations:', drawingData);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        <TextFieldsIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Drawing Annotations Demo
      </Typography>

      <Alert severity="info" sx={{ mb: 4 }}>
        This demo showcases the annotation functionality in FreeformDrawingBlock. 
        Toggle annotation mode to add text labels, drag them around, and customize their appearance.
      </Alert>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Interactive Drawing Canvas with Annotations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Draw with your mouse/touch, then switch to annotation mode to add text labels
            </Typography>
            
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
              <FreeformDrawingBlock
                blockId="demo-annotation-block"
                entityId="demo-entity"
                entityType="note"
                onSave={handleSave}
                width={800}
                height={500}
                autoSaveDelay={1000}
                showSaveIndicator={true}
                saveIndicatorPosition="top-right"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {savedDrawings.length > 0 && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Saved Drawings with Annotations: {savedDrawings.length}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default AnnotationDemo; 