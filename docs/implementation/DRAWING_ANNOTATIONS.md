# Drawing Annotations Feature

## Overview

The Drawing Annotations feature extends the FreeformDrawingBlock component with the ability to overlay text labels on sketches. Users can add, edit, move, and style text annotations that are saved alongside the drawing data.

## Key Features

### 🏷️ Annotation Mode Toggle
- **Mode Switching**: Toggle between drawing and annotation modes
- **Visual Feedback**: Cursor changes to indicate current mode
- **Seamless Integration**: Annotations work alongside existing drawing functionality

### 📝 Text Annotation Creation
- **Click-to-Add**: Click anywhere on canvas in annotation mode to add text
- **Prompt Input**: Simple text input dialog for annotation content
- **Auto-Positioning**: Annotations are placed at click coordinates

### 🎯 Drag-and-Drop Functionality
- **Repositioning**: Drag annotations to any position on the canvas
- **Visual Feedback**: Opacity changes during drag operations
- **Precise Placement**: Annotations snap to exact coordinates

### ✏️ Annotation Editing
- **Text Editing**: Double-click annotations to edit text content
- **Style Customization**: Comprehensive styling options
- **Real-time Updates**: Changes are applied immediately

### 🎨 Styling Options
- **Font Size**: Adjustable from 8px to 48px
- **Text Color**: Custom hex color values
- **Background Color**: Annotation background customization
- **Border Styling**: Color, width, and radius options
- **Padding**: Internal spacing control

## Technical Implementation

### Data Structures

```typescript
export interface DrawingAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding: number;
  borderRadius: number;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingData {
  strokes: DrawingStroke[];
  annotations: DrawingAnnotation[]; // New field
  svgPath: string;
  pngThumbnail: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}
```

### Component State

```typescript
// Annotation state
const [annotations, setAnnotations] = useState<DrawingAnnotation[]>([]);
const [isAnnotationMode, setIsAnnotationMode] = useState(false);
const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
const [draggedAnnotation, setDraggedAnnotation] = useState<string | null>(null);
const [annotationSettings, setAnnotationSettings] = useState({
  fontSize: 14,
  color: '#000000',
  backgroundColor: '#ffffff',
  borderColor: '#cccccc',
  borderWidth: 1,
  padding: 4,
  borderRadius: 4
});
```

### Core Functions

#### Adding Annotations
```typescript
const addAnnotation = (text: string, x: number, y: number) => {
  const newAnnotation: DrawingAnnotation = {
    id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    x,
    y,
    fontSize: annotationSettings.fontSize,
    color: annotationSettings.color,
    backgroundColor: annotationSettings.backgroundColor,
    borderColor: annotationSettings.borderColor,
    borderWidth: annotationSettings.borderWidth,
    padding: annotationSettings.padding,
    borderRadius: annotationSettings.borderRadius,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  setAnnotations(prev => [...prev, newAnnotation]);
  setSelectedAnnotation(newAnnotation.id);
};
```

#### Updating Annotations
```typescript
const updateAnnotation = (id: string, updates: Partial<DrawingAnnotation>) => {
  setAnnotations(prev => prev.map(annotation => 
    annotation.id === id 
      ? { ...annotation, ...updates, updatedAt: new Date().toISOString() }
      : annotation
  ));
};
```

#### Drag-and-Drop Handling
```typescript
const handleCanvasDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return;

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (draggedAnnotation) {
    // Move existing annotation
    updateAnnotation(draggedAnnotation, { x, y });
  } else {
    // Add new annotation from external drop
    const text = e.dataTransfer.getData('text/plain') || 'New Annotation';
    addAnnotation(text, x, y);
  }
};
```

## UI Components

### Annotation Mode Toggle
```typescript
<Tooltip title={isAnnotationMode ? "Exit Annotation Mode" : "Enter Annotation Mode"}>
  <IconButton 
    size="small" 
    onClick={() => setIsAnnotationMode(!isAnnotationMode)}
    disabled={readOnly}
    color={isAnnotationMode ? "primary" : "default"}
  >
    <TextFieldsIcon />
  </IconButton>
</Tooltip>
```

### Annotation Rendering
```typescript
{annotations.map((annotation) => (
  <Box
    key={annotation.id}
    draggable={!readOnly}
    onDragStart={(e) => handleAnnotationDragStart(e, annotation.id)}
    onDragEnd={handleAnnotationDragEnd}
    onClick={() => handleAnnotationClick(annotation.id)}
    onDoubleClick={() => handleAnnotationDoubleClick(annotation.id)}
    sx={{
      position: 'absolute',
      left: annotation.x,
      top: annotation.y,
      transform: 'translate(-50%, -50%)',
      cursor: isAnnotationMode ? 'pointer' : 'default',
      zIndex: selectedAnnotation === annotation.id ? 10 : 5,
      '&:hover': { zIndex: 15 }
    }}
  >
    <Box
      sx={{
        fontSize: annotation.fontSize,
        color: annotation.color,
        backgroundColor: annotation.backgroundColor,
        border: `${annotation.borderWidth}px solid ${annotation.borderColor}`,
        borderRadius: `${annotation.borderRadius}px`,
        padding: `${annotation.padding}px`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        boxShadow: selectedAnnotation === annotation.id ? '0 0 0 2px #1976d2' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        opacity: draggedAnnotation === annotation.id ? 0.5 : 1,
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          transform: 'translate(-50%, -50%) scale(1.05)'
        }
      }}
    >
      {annotation.text}
    </Box>
  </Box>
))}
```

## Usage Examples

### Basic Annotation Creation
```typescript
// Enable annotation mode
setIsAnnotationMode(true);

// Add annotation on canvas click
const handleCanvasClick = (event: React.MouseEvent) => {
  if (isAnnotationMode) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const text = prompt('Enter annotation text:') || 'New Annotation';
      if (text.trim()) {
        addAnnotation(text, x, y);
      }
    }
  }
};
```

### Annotation Styling
```typescript
// Update annotation settings
setAnnotationSettings(prev => ({
  ...prev,
  fontSize: 18,
  color: '#ff0000',
  backgroundColor: '#ffff00',
  borderColor: '#000000',
  borderWidth: 2,
  padding: 8,
  borderRadius: 8
}));
```

### External Drag-and-Drop
```typescript
// Handle external text drops
const handleExternalDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const text = e.dataTransfer.getData('text/plain');
  if (text) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addAnnotation(text, x, y);
    }
  }
};
```

## Integration Points

### Auto-Save Integration
Annotations are automatically saved with the drawing data:
```typescript
// Auto-save when strokes or annotations change
useEffect(() => {
  if ((strokes.length > 0 || annotations.length > 0) && !readOnly) {
    const autoSave = async () => {
      const drawingData: DrawingData = {
        strokes,
        annotations, // Include annotations in save data
        svgPath,
        pngThumbnail,
        width: canvasSize.width,
        height: canvasSize.height,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await syncActions.saveDrawing(drawingData);
    };
    autoSave();
  }
}, [strokes, annotations, canvasSize, readOnly, initialData?.createdAt]);
```

### Export Integration
Annotations are included in all export formats:
- **PDF**: Annotations rendered as text overlays
- **HTML**: Annotations as positioned div elements
- **SVG**: Annotations as text elements
- **PNG**: Annotations rendered into the image

## Demo Page

Access the annotation demo at `/annotation-demo` to see the functionality in action.

## Future Enhancements

### Planned Features
- **Rich Text Support**: Bold, italic, underline formatting
- **Annotation Templates**: Predefined annotation styles
- **Bulk Operations**: Select and modify multiple annotations
- **Annotation Layers**: Z-index management for complex drawings
- **Annotation Search**: Find and highlight specific annotations

### Advanced Features
- **Voice Annotations**: Speech-to-text for hands-free annotation
- **Annotation History**: Track changes and revert modifications
- **Collaborative Annotations**: Real-time annotation sharing
- **Annotation Export**: Export annotations as separate data files

## Troubleshooting

### Common Issues

1. **Annotations Not Appearing**
   - Check if annotation mode is enabled
   - Verify canvas click handlers are working
   - Ensure annotations array is properly initialized

2. **Drag-and-Drop Not Working**
   - Check if `draggable` attribute is set correctly
   - Verify drag event handlers are attached
   - Ensure canvas drop zone is properly configured

3. **Styling Not Applied**
   - Check annotation settings object
   - Verify CSS properties are correctly formatted
   - Ensure Material-UI theme compatibility

### Debug Information
- Enable console logging for annotation operations
- Check annotation state in React DevTools
- Verify canvas coordinate calculations
- Monitor drag-and-drop event flow

## Conclusion

The Drawing Annotations feature provides a powerful and intuitive way to add text labels to sketches. With comprehensive styling options, drag-and-drop functionality, and seamless integration with existing drawing features, it enhances the overall drawing experience while maintaining data integrity and export compatibility. 