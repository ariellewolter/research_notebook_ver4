# Export Components

This directory contains the refactored export components, breaking down the original monolithic `AdvancedCitationExport.tsx` file into smaller, focused components and utilities.

## Structure

### Components
- **`AdvancedCitationExport.tsx`** - Main orchestration component with tabs
- **`CitationExport.tsx`** - Focused component for citation export functionality
- **`TimelineExport.tsx`** - Focused component for research timeline export

### Utilities
- **`citationFormatter.ts`** - Citation formatting logic and CSL conversion
- **`exportFormatters.ts`** - Export format generation (RTF, HTML, DOCX, BibTeX, Timeline)

### Constants
- **`citationStyles.ts`** - Citation style definitions and constants

## Components

### AdvancedCitationExport
- **Purpose**: Main dialog component that orchestrates citation and timeline exports
- **Features**: 
  - Tab-based interface for different export types
  - Shared state management for loading and error handling
  - File export coordination
- **Props**: `open`, `onClose`, `literatureNotes`, `projects`, `experiments`, `protocols`

### CitationExport
- **Purpose**: Handles citation export with style selection and format options
- **Features**:
  - Citation style selection (APA, MLA, Chicago, IEEE, etc.)
  - Export format selection (Bibliography, In-text, Footnotes)
  - Literature note selection with checkboxes
  - Multiple export formats (TXT, RTF, HTML, DOCX, BibTeX)
- **Props**: `literatureNotes`, `filename`, `onFilenameChange`, `loading`, `onExport`

### TimelineExport
- **Purpose**: Handles research timeline export with project/experiment/protocol data
- **Features**:
  - Timeline data generation from projects, experiments, and protocols
  - Export format options (CSV, JSON, Excel)
  - Timeline summary with statistics
- **Props**: `projects`, `experiments`, `protocols`, `loading`, `onExport`

## Utilities

### citationFormatter.ts
```typescript
// Citation formatting functions
formatCitation(item: LiteratureNote, style: string): string
formatAPACitation(item: CitationItem): string
formatMLACitation(item: CitationItem): string
formatChicagoAuthorDate(item: CitationItem): string
formatIEEECitation(item: CitationItem): string

// Data conversion
convertToCSLFormat(item: LiteratureNote): CitationItem
```

### exportFormatters.ts
```typescript
// Citation export formats
generateRTF(citations: string[]): string
generateHTML(citations: string[], style: string): string
generateDocx(citations: string[]): string
generateBibTeX(notes: LiteratureNote[]): string

// Timeline export
generateTimelineData(projects, experiments, protocols): TimelineItem[]
formatTimelineForExport(timelineData): any[]
```

### citationStyles.ts
```typescript
// Citation style definitions
CITATION_STYLES: CitationStyle[]
interface CitationStyle {
    key: string;
    name: string;
    url: string;
}
```

## Usage

### Basic Usage
```typescript
import { AdvancedCitationExport } from '../components/Export';

const MyComponent = () => {
    const [exportOpen, setExportOpen] = useState(false);
    
    return (
        <AdvancedCitationExport
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            literatureNotes={literatureNotes}
            projects={projects}
            experiments={experiments}
            protocols={protocols}
        />
    );
};
```

### Using Individual Components
```typescript
import { CitationExport, TimelineExport } from '../components/Export';

// Citation export only
<CitationExport
    literatureNotes={literatureNotes}
    filename="my-citations"
    onFilenameChange={setFilename}
    loading={loading}
    onExport={handleExport}
/>

// Timeline export only
<TimelineExport
    projects={projects}
    experiments={experiments}
    protocols={protocols}
    loading={loading}
    onExport={handleTimelineExport}
/>
```

### Using Utilities Directly
```typescript
import { formatCitation } from '../utils/citationFormatter';
import { generateRTF } from '../utils/exportFormatters';

// Format a single citation
const citation = formatCitation(literatureNote, 'apa');

// Generate RTF content
const rtfContent = generateRTF(citations);
```

## Benefits of Refactoring

### 1. **Separation of Concerns**
- Each component has a single responsibility
- Citation logic separated from timeline logic
- Formatting utilities isolated from UI components

### 2. **Reusability**
- Individual components can be used independently
- Utilities can be imported and used in other parts of the app
- Citation formatting can be used outside of export functionality

### 3. **Maintainability**
- Smaller files are easier to navigate and modify
- Changes to citation formatting don't affect timeline export
- Better code organization and structure

### 4. **Testability**
- Individual components are easier to unit test
- Utilities can be tested independently
- Mock data can be easily provided for testing

### 5. **Type Safety**
- Better TypeScript support with focused interfaces
- Clear prop types for each component
- Improved IDE autocomplete and error detection

## File Structure

```
src/components/Export/
├── index.ts                    # Barrel exports
├── README.md                   # Documentation
├── AdvancedCitationExport.tsx  # Main orchestration component
├── CitationExport.tsx          # Citation export component
└── TimelineExport.tsx          # Timeline export component

src/utils/
├── citationFormatter.ts        # Citation formatting utilities
└── exportFormatters.ts         # Export format generation

src/constants/
└── citationStyles.ts           # Citation style definitions
```

## Migration Guide

### From Monolithic Component

**Before:**
```typescript
import AdvancedCitationExport from '../components/Export/AdvancedCitationExport';
```

**After:**
```typescript
// Same import still works!
import AdvancedCitationExport from '../components/Export/AdvancedCitationExport';

// Or import specific components
import { CitationExport, TimelineExport } from '../components/Export';
```

### Adding New Export Formats

1. Add the format generation function to `exportFormatters.ts`
2. Add the export button to the appropriate component
3. Handle the export in the component's export handler

```typescript
// exportFormatters.ts
export const generateNewFormat = (data: any): string => {
    // Format generation logic
    return formattedContent;
};

// Component
const handleExportNewFormat = () => {
    const content = generateNewFormat(data);
    onExport('newformat', content, 'newformat');
};
```

## Error Handling

All components include:
- Loading states during export operations
- Error messages for failed exports
- Success notifications for completed exports
- Graceful handling of file system errors

## File Export

The components support multiple export methods:
- **Native File Dialog**: Using `saveFileDialog` for better UX
- **Direct Download**: Using `saveAs` for immediate downloads
- **Format-specific**: Different handling for different file types 