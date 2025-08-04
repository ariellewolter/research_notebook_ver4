export type ProjectStatus = 'active' | 'archived' | 'future';

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: string | null;
    lastActivity?: string | null;
    createdAt: string;
    experiments?: Experiment[];
}

export interface Experiment {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
} 