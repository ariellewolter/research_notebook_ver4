export interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    startDate?: Date;
    lastActivity?: Date;
    createdAt: Date;
    userId: string;
}

export interface ProjectWithExperiments extends Project {
    experiments: Experiment[];
    _count?: {
        experiments: number;
    };
}

export interface Experiment {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    projectId: string;
    notes?: Array<{
        id: string;
        title: string;
        type: string;
        createdAt: Date;
    }>;
}

export type CreateProjectData = Omit<Project, 'id' | 'userId' | 'createdAt'>;
export type UpdateProjectData = Partial<CreateProjectData>; 