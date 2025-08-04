import { PrismaClient } from '@prisma/client';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { CreateProjectData, UpdateProjectData, ProjectWithExperiments } from '../types/project.types';

export class ProjectService {
    constructor(
        private projectRepository: ProjectRepository = new ProjectRepository()
    ) {}

    async getAllProjects(userId: string, filters?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ projects: any[]; total: number; pagination: any }> {
        const { page = 1, limit = 10, ...filterParams } = filters || {};
        const skip = (page - 1) * limit;

        const [projects, total] = await Promise.all([
            this.projectRepository.findMany({
                userId,
                ...filterParams,
                skip,
                take: limit,
            }),
            this.projectRepository.count({ userId, ...filterParams }),
        ]);

        return {
            projects,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    async getProjectById(id: string, userId: string): Promise<any> {
        return this.projectRepository.findByIdWithExperiments(id, userId);
    }

    async createProject(data: CreateProjectData, userId: string): Promise<any> {
        return this.projectRepository.create({
            ...data,
            userId,
        });
    }

    async updateProject(id: string, data: UpdateProjectData, userId: string): Promise<any> {
        const existingProject = await this.projectRepository.findById(id, userId);
        if (!existingProject) {
            throw new Error('Project not found');
        }

        return this.projectRepository.update(id, data);
    }

    async deleteProject(id: string, userId: string): Promise<void> {
        const existingProject = await this.projectRepository.findById(id, userId);
        if (!existingProject) {
            throw new Error('Project not found');
        }

        await this.projectRepository.delete(id);
    }

    async getProjectStats(userId: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
        recent: any[];
    }> {
        return this.projectRepository.getStats(userId);
    }
} 