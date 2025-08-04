export interface Project {
    id: string;
    title: string;
    description?: string;
    status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    startDate?: string;
    endDate?: string;
    tags: string[];
    metadata?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectWithExperiments extends Project {
    experiments: Experiment[];
    _count?: {
        experiments: number;
    };
}

export interface Experiment {
    id: string;
    title: string;
    description?: string;
    status: string;
    createdAt: string;
    notes?: Array<{
        id: string;
        title: string;
        type: string;
        createdAt: string;
    }>;
}

export type CreateProjectData = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProjectData = Partial<CreateProjectData>; 