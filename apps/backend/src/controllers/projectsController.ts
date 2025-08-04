import { Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';
import { createProjectSchema, updateProjectSchema } from '../validation/projectSchemas';
import { asyncHandler } from '../middleware/asyncHandler';

const projectService = new ProjectService();

export const projectsController = {
    getAllProjects: asyncHandler(async (req: any, res: Response) => {
        const { page, limit, status, search } = req.query;
        
        const result = await projectService.getAllProjects(req.user.userId, {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status,
            search,
        });

        res.json(result);
    }),

    getProjectById: asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        
        const project = await projectService.getProjectById(id, req.user.userId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    }),

    createProject: asyncHandler(async (req: any, res: Response) => {
        const validatedData = createProjectSchema.parse(req.body);
        
        // Transform string dates to Date objects
        const projectData = {
            ...validatedData,
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
            lastActivity: validatedData.lastActivity ? new Date(validatedData.lastActivity) : undefined,
        };
        
        const project = await projectService.createProject(projectData, req.user.userId);
        
        res.status(201).json(project);
    }),

    updateProject: asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        const validatedData = updateProjectSchema.parse(req.body);
        
        // Transform string dates to Date objects
        const projectData = {
            ...validatedData,
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
            lastActivity: validatedData.lastActivity ? new Date(validatedData.lastActivity) : undefined,
        };
        
        const project = await projectService.updateProject(id, projectData, req.user.userId);
        
        res.json(project);
    }),

    deleteProject: asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        
        await projectService.deleteProject(id, req.user.userId);
        
        res.status(204).send();
    }),

    getProjectStats: asyncHandler(async (req: any, res: Response) => {
        const stats = await projectService.getProjectStats(req.user.userId);
        res.json(stats);
    }),
}; 