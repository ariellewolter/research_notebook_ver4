# Protocol Template System Implementation

## Overview

The Protocol Template System is a comprehensive solution for designing, managing, and executing step-by-step laboratory procedures. It provides a rich interface for creating protocol templates with various content types and a mobile-friendly execution environment optimized for iPad use.

## Features

### Core Features
- **Protocol Template Editor**: Rich editor for creating step-by-step procedures
- **Protocol Executor**: Mobile-friendly execution interface with real-time tracking
- **Template Browser**: Search, filter, and manage protocol templates
- **Auto-generated Lab Notes**: Automatic generation of lab session documentation
- **Variable System**: Configurable parameters for protocol customization
- **Multi-media Support**: Text, images, sketches, timers, and reagent information

### Content Types
- **Text**: Rich text instructions and descriptions
- **Images**: Photo uploads and captures during execution
- **Sketches**: Drawing tools for annotations and diagrams
- **Variables**: Configurable parameters (text, number, select, date)
- **Timers**: Built-in timing functionality with notifications
- **Reagents**: Specialized reagent information and tracking

## Architecture

### Components

#### 1. ProtocolTemplateEditor
**Location**: `apps/frontend/src/components/Protocols/ProtocolTemplateEditor.tsx`

**Purpose**: Main interface for creating and editing protocol templates

**Key Features**:
- Drag-and-drop step reordering
- Rich content editing for each step type
- Variable definition and management
- Template metadata (name, description, category, difficulty)
- Real-time preview mode
- Image upload and sketch creation tools

**Key Functions**:
```typescript
// Add new protocol step
const addStep = () => {
  const newStep: ProtocolStep = {
    id: generateStepId(),
    order: template.steps.length + 1,
    title: '',
    description: '',
    type: 'text',
    content: '',
  };
  setSelectedStep(newStep);
  setStepDialogOpen(true);
};

// Save step with validation
const saveStep = () => {
  if (!selectedStep) return;
  
  const updatedSteps = selectedStep.id 
    ? template.steps.map(step => step.id === selectedStep.id ? selectedStep : step)
    : [...template.steps, { ...selectedStep, order: template.steps.length + 1 }];

  setTemplate(prev => ({
    ...prev,
    steps: updatedSteps,
  }));
};
```

#### 2. ProtocolExecutor
**Location**: `apps/frontend/src/components/Protocols/ProtocolExecutor.tsx`

**Purpose**: Mobile-optimized interface for executing protocols

**Key Features**:
- Full-screen execution mode
- Step-by-step navigation with progress tracking
- Real-time timer functionality
- Photo capture and annotation tools
- Auto-generated lab notes
- Pause/resume functionality
- Floating action buttons for easy access

**Mobile Optimizations**:
- Touch-friendly interface
- Large buttons and controls
- Swipe gestures for navigation
- Fullscreen mode for distraction-free execution
- Optimized layout for iPad screens

**Key Functions**:
```typescript
// Start protocol execution
const startExecution = () => {
  setExecution(prev => prev ? {
    ...prev,
    status: 'in-progress',
    startTime: new Date(),
    currentStep: 0,
  } : null);
  
  setSteps(prev => prev.map((step, index) => 
    index === 0 ? { ...step, startTime: new Date() } : step
  ));
};

// Complete current step and advance
const completeStep = (stepIndex: number) => {
  const updatedSteps = steps.map((step, index) => {
    if (index === stepIndex) {
      return { ...step, completed: true, endTime: new Date() };
    }
    return step;
  });

  setSteps(updatedSteps);

  if (stepIndex < steps.length - 1) {
    const nextStepIndex = stepIndex + 1;
    setActiveStep(nextStepIndex);
    setExecution(prev => prev ? { ...prev, currentStep: nextStepIndex } : null);
  } else {
    setExecution(prev => prev ? {
      ...prev,
      status: 'completed',
      endTime: new Date(),
    } : null);
  }
};
```

#### 3. ProtocolTemplateBrowser
**Location**: `apps/frontend/src/components/Protocols/ProtocolTemplateBrowser.tsx`

**Purpose**: Browse, search, and manage protocol templates

**Key Features**:
- Advanced search and filtering
- Category and difficulty filtering
- Rating and review system
- Favorites and bookmarks
- Execution history tracking
- Template sharing capabilities

**Key Functions**:
```typescript
// Filter and sort templates
useEffect(() => {
  let filtered = templates;

  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Apply category and difficulty filters
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(template => template.category === selectedCategory);
  }
  if (selectedDifficulty !== 'all') {
    filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'rating': return b.rating - a.rating;
      case 'duration': return a.estimatedDuration - b.estimatedDuration;
      case 'recent': return b.updatedAt.getTime() - a.updatedAt.getTime();
      case 'popular': return b.executionCount - a.executionCount;
      default: return 0;
    }
  });

  setFilteredTemplates(filtered);
}, [templates, searchQuery, selectedCategory, selectedDifficulty, sortBy]);
```

## Data Models

### ProtocolStep
```typescript
interface ProtocolStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'text' | 'image' | 'sketch' | 'variable' | 'timer' | 'reagent';
  content: any;
  duration?: number;
  reagents?: string[];
  variables?: ProtocolVariable[];
  imageUrl?: string;
  sketchData?: any;
}
```

### ProtocolVariable
```typescript
interface ProtocolVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'date';
  defaultValue?: any;
  options?: string[];
  required: boolean;
  description: string;
}
```

### ProtocolTemplate
```typescript
interface ProtocolTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: ProtocolStep[];
  variables: ProtocolVariable[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ProtocolExecution
```typescript
interface ProtocolExecution {
  id: string;
  templateId: string;
  templateName: string;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed' | 'abandoned';
  currentStep: number;
  startTime: Date | null;
  endTime: Date | null;
  variables: Record<string, any>;
  stepNotes: Record<string, string>;
  stepImages: Record<string, string>;
  stepSketches: Record<string, any>;
  stepTimers: Record<string, { startTime: number; duration: number; remaining: number }>;
}
```

## Auto-Generated Lab Notes

The system automatically generates comprehensive lab notes during protocol execution:

```typescript
const generateLabNotes = () => {
  const noteContent = `
# Lab Session: ${execution?.templateName}

**Date:** ${execution?.startTime?.toLocaleDateString()}
**Duration:** ${notes.duration} minutes
**Status:** ${execution?.status}

## Protocol Variables
${Object.entries(execution?.variables || {}).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## Steps Completed

${steps.map((step, index) => `
### ${index + 1}. ${step.title}
**Duration:** ${step.duration} minutes
**Notes:** ${step.notes || 'No notes'}
**Images:** ${step.images.length} captured
**Status:** ${step.completed ? 'Completed' : 'Not completed'}
`).join('\n')}

## Summary
Protocol execution ${execution?.status === 'completed' ? 'completed successfully' : 'was interrupted'}.
  `.trim();

  return noteContent;
};
```

## Mobile-First Design

### iPad Optimizations
- **Touch Targets**: Minimum 44px touch targets for all interactive elements
- **Gesture Support**: Swipe gestures for navigation between steps
- **Fullscreen Mode**: Distraction-free execution environment
- **Floating Actions**: Easy access to primary actions
- **Responsive Layout**: Adaptive layout for different screen orientations

### Key Mobile Features
```typescript
// Fullscreen toggle
const [fullscreen, setFullscreen] = useState(false);

// Floating action buttons
<Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
  {execution.status === 'not-started' && (
    <Fab color="primary" onClick={startExecution}>
      <StartIcon />
    </Fab>
  )}
  
  {execution.status === 'in-progress' && (
    <>
      <Fab color="secondary" onClick={pauseExecution}>
        <PauseIcon />
      </Fab>
      <Fab color="error" onClick={() => setExecution(prev => prev ? { ...prev, status: 'abandoned' } : null)}>
        <StopIcon />
      </Fab>
    </>
  )}
</Box>
```

## Timer System

Built-in timer functionality for time-sensitive protocol steps:

```typescript
const startTimer = (stepId: string, duration: number) => {
  setCurrentTimer({ stepId, duration });
  setTimerDialogOpen(true);
  
  setExecution(prev => prev ? {
    ...prev,
    stepTimers: {
      ...prev.stepTimers,
      [stepId]: {
        startTime: Date.now(),
        duration,
        remaining: duration,
      },
    },
  } : null);
};

// Timer countdown
useEffect(() => {
  if (currentTimer && timerRef.current) {
    timerRef.current = setInterval(() => {
      setExecution(prev => {
        if (!prev) return prev;
        
        const timer = prev.stepTimers[currentTimer.stepId];
        if (timer && timer.remaining > 0) {
          return {
            ...prev,
            stepTimers: {
              ...prev.stepTimers,
              [currentTimer.stepId]: {
                ...timer,
                remaining: timer.remaining - 1,
              },
            },
          };
        } else {
          setCurrentTimer(null);
          setTimerDialogOpen(false);
          return prev;
        }
      });
    }, 1000);
  }

  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, [currentTimer]);
```

## Usage Guide

### Creating a Protocol Template

1. **Open Template Editor**: Navigate to the Protocol Template Editor
2. **Basic Information**: Fill in template name, description, category, and difficulty
3. **Add Variables**: Define any configurable parameters
4. **Create Steps**: Add protocol steps with appropriate content types
5. **Configure Content**: Add text, images, sketches, or timer information
6. **Save Template**: Save and optionally share the template

### Executing a Protocol

1. **Browse Templates**: Use the Template Browser to find protocols
2. **Select Template**: Choose a protocol and configure variables
3. **Start Execution**: Begin protocol execution
4. **Follow Steps**: Navigate through steps with the mobile-optimized interface
5. **Add Notes**: Capture photos, add notes, and track progress
6. **Complete Protocol**: Finish execution and generate lab notes

### Mobile Execution Workflow

1. **Fullscreen Mode**: Enter fullscreen for distraction-free execution
2. **Step Navigation**: Use swipe gestures or buttons to navigate
3. **Timer Management**: Start timers for time-sensitive steps
4. **Photo Capture**: Take photos of results or important moments
5. **Note Taking**: Add real-time notes for each step
6. **Progress Tracking**: Monitor completion status and time spent

## Integration Points

### Notes System Integration
- Auto-generated lab notes are saved to the notes system
- Integration with existing note templates and formatting
- Support for linking protocol executions to projects

### Project Integration
- Protocols can be associated with specific projects
- Execution history tracked per project
- Integration with project timelines and milestones

### Export System
- Protocol templates can be exported in various formats
- Execution data can be included in project reports
- Support for sharing protocols with collaborators

## Future Enhancements

### Planned Features
- **Collaborative Editing**: Real-time collaborative protocol editing
- **Version Control**: Protocol template versioning and history
- **Advanced Analytics**: Execution analytics and optimization suggestions
- **Equipment Integration**: Integration with laboratory equipment
- **AI Assistance**: AI-powered protocol optimization and suggestions

### Technical Improvements
- **Offline Support**: Full offline protocol execution
- **Performance Optimization**: Improved rendering for large protocols
- **Accessibility**: Enhanced accessibility features
- **Internationalization**: Multi-language support

## Testing

### Unit Tests
- Component rendering and state management
- Timer functionality and accuracy
- Data validation and error handling
- Mobile responsiveness and touch interactions

### Integration Tests
- End-to-end protocol creation and execution
- Notes system integration
- Export functionality
- Cross-device compatibility

### User Testing
- Mobile usability testing on iPad
- Laboratory environment testing
- Accessibility testing
- Performance testing with large protocols

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Load protocol content on demand
- **Image Compression**: Optimize image storage and loading
- **Caching**: Cache frequently used templates
- **Virtual Scrolling**: Handle large protocol lists efficiently

### Memory Management
- **Image Cleanup**: Proper cleanup of captured images
- **Timer Cleanup**: Clear intervals and timeouts
- **State Optimization**: Minimize unnecessary re-renders

## Security Considerations

### Data Protection
- **User Permissions**: Role-based access to protocol templates
- **Data Encryption**: Encrypt sensitive protocol data
- **Audit Trail**: Track protocol modifications and executions
- **Backup**: Regular backup of protocol templates and execution data

### Privacy
- **Photo Privacy**: Secure storage of captured images
- **User Data**: Protect user-specific protocol preferences
- **Sharing Controls**: Granular control over protocol sharing

## Conclusion

The Protocol Template System provides a comprehensive solution for laboratory protocol management with a focus on usability, mobile optimization, and integration with existing research workflows. The system's modular design allows for easy extension and customization while maintaining a consistent user experience across different devices and use cases. 