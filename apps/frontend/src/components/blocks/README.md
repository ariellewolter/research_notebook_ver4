# FreeformDrawingBlock Component

A universal drawing block component that supports both touch and mouse input, saves drawings as vector data (SVG paths) and raster (PNG thumbnail), and can be embedded across different entity types.

## Features

- **Universal Embedding**: Works across Notes, Projects, Protocols, Tasks, and Database Entries
- **Touch & Mouse Support**: Full support for both touch devices and mouse input
- **Vector & Raster Export**: Saves drawings as SVG paths and PNG thumbnails
- **Undo/Redo**: Complete stroke history management
- **Brush Customization**: Multiple colors and brush sizes
- **Pressure Sensitivity**: Supports pressure-sensitive input devices
- **Responsive Design**: Adapts to container size and device pixel ratio
- **Read-only Mode**: Can be displayed in read-only mode for viewing

## Basic Usage

```tsx
import { FreeformDrawingBlock } from '../components/blocks';

const MyComponent = () => {
  const handleSave = async (data: DrawingData) => {
    // Save the drawing data to your backend
    console.log('Drawing saved:', data);
  };

  return (
    <FreeformDrawingBlock
      blockId="unique-block-id"
      entityId="entity-id"
      entityType="note"
      onSave={handleSave}
      width={600}
      height={400}
    />
  );
};
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `blockId` | `string` | Yes | - | Unique identifier for the drawing block |
| `entityId` | `string` | Yes | - | ID of the parent entity (note, project, etc.) |
| `entityType` | `'note' \| 'project' \| 'protocol' \| 'task' \| 'database'` | Yes | - | Type of entity this drawing belongs to |
| `onSave` | `(data: DrawingData) => void` | Yes | - | Callback function when drawing is saved |
| `initialData` | `DrawingData` | No | - | Initial drawing data to load |
| `readOnly` | `boolean` | No | `false` | Whether the drawing is read-only |
| `className` | `string` | No | `''` | Additional CSS class names |
| `width` | `number` | No | `600` | Canvas width in pixels |
| `height` | `number` | No | `400` | Canvas height in pixels |

## Data Structure

### DrawingData Interface

```typescript
interface DrawingData {
  strokes: DrawingStroke[];
  svgPath: string;
  pngThumbnail: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}
```

### DrawingStroke Interface

```typescript
interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
  opacity: number;
}
```

### DrawingPoint Interface

```typescript
interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}
```

## Integration Examples

### In a Note Component

```tsx
import { FreeformDrawingBlock } from '../components/blocks';

const NoteComponent = ({ noteId, content }) => {
  const handleDrawingSave = async (drawingData) => {
    // Save drawing to note
    await updateNote(noteId, {
      ...content,
      drawings: [...(content.drawings || []), drawingData]
    });
  };

  return (
    <div>
      <h1>Research Note</h1>
      <p>{content.text}</p>
      
      <FreeformDrawingBlock
        blockId={`note-${noteId}-drawing`}
        entityId={noteId}
        entityType="note"
        onSave={handleDrawingSave}
        initialData={content.latestDrawing}
      />
    </div>
  );
};
```

### In a Project Component

```tsx
import { FreeformDrawingBlock } from '../components/blocks';

const ProjectComponent = ({ projectId, project }) => {
  const handleDrawingSave = async (drawingData) => {
    // Save drawing to project
    await updateProject(projectId, {
      ...project,
      diagrams: [...(project.diagrams || []), drawingData]
    });
  };

  return (
    <div>
      <h1>{project.name}</h1>
      
      <FreeformDrawingBlock
        blockId={`project-${projectId}-diagram`}
        entityId={projectId}
        entityType="project"
        onSave={handleDrawingSave}
        width={800}
        height={600}
      />
    </div>
  );
};
```

### In a Protocol Component

```tsx
import { FreeformDrawingBlock } from '../components/blocks';

const ProtocolComponent = ({ protocolId, protocol }) => {
  const handleDrawingSave = async (drawingData) => {
    // Save drawing to protocol
    await updateProtocol(protocolId, {
      ...protocol,
      illustrations: [...(protocol.illustrations || []), drawingData]
    });
  };

  return (
    <div>
      <h1>{protocol.name}</h1>
      
      <FreeformDrawingBlock
        blockId={`protocol-${protocolId}-illustration`}
        entityId={protocolId}
        entityType="protocol"
        onSave={handleDrawingSave}
        readOnly={protocol.isPublished}
      />
    </div>
  );
};
```

## Demo Component

Use the `FreeformDrawingBlockDemo` component to see all features in action:

```tsx
import { FreeformDrawingBlockDemo } from '../components/blocks';

const DemoPage = () => {
  return <FreeformDrawingBlockDemo />;
};
```

## Styling

The component uses Material-UI components and can be customized using the `className` prop or by overriding the Material-UI theme.

## Browser Support

- Modern browsers with Canvas API support
- Touch devices with touch event support
- Pressure-sensitive devices (optional)

## Performance Considerations

- Large drawings with many strokes may impact performance
- Consider implementing stroke culling for very large drawings
- The component automatically handles device pixel ratio for high-DPI displays 