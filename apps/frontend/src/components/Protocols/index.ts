// Protocol Template Editor
export { ProtocolTemplateEditor } from './ProtocolTemplateEditor';

// Protocol Executor
export { ProtocolExecutor } from './ProtocolExecutor';

// Protocol Template Browser
export { ProtocolTemplateBrowser } from './ProtocolTemplateBrowser';

// Types
export interface ProtocolStep {
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

export interface ProtocolVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'date';
  defaultValue?: any;
  options?: string[];
  required: boolean;
  description: string;
}

export interface ProtocolTemplate {
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

export interface ProtocolExecution {
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

export interface ExecutionStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'text' | 'image' | 'sketch' | 'variable' | 'timer' | 'reagent';
  content: any;
  duration?: number;
  completed: boolean;
  notes: string;
  images: string[];
  sketches: any[];
  startTime?: Date;
  endTime?: Date;
} 