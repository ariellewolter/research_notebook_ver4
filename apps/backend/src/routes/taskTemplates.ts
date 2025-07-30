import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  title: z.string().min(1),
  defaultPriority: z.enum(['high', 'medium', 'low']).default('medium'),
  defaultStatus: z.enum(['todo', 'in_progress', 'done', 'overdue', 'cancelled']).default('todo'),
  estimatedHours: z.number().optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurringPattern: z.string().optional().nullable(), // JSON string
  tags: z.string().optional().nullable(), // JSON array
  category: z.string().optional().nullable(),
  variables: z.string().optional().nullable(), // JSON object
  isPublic: z.boolean().optional().default(false),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  title: z.string().min(1).optional(),
  defaultPriority: z.enum(['high', 'medium', 'low']).optional(),
  defaultStatus: z.enum(['todo', 'in_progress', 'done', 'overdue', 'cancelled']).optional(),
  estimatedHours: z.number().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  variables: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
});

// Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.taskTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.taskTemplate.findUnique({
      where: { id },
      include: { tasks: true }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const validated = createTemplateSchema.parse(req.body);
    const template = await prisma.taskTemplate.create({
      data: validated
    });
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateTemplateSchema.parse(req.body);
    const template = await prisma.taskTemplate.update({
      where: { id },
      data: validated
    });
    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.taskTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Create task from template
router.post('/:id/create-task', async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId, experimentId, protocolId, noteId, deadline, customTitle, variables } = req.body;
    
    const template = await prisma.taskTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Process template variables if provided
    let processedTitle = customTitle || template.title;
    let processedDescription = template.description;
    
    if (variables && template.variables) {
      try {
        const templateVars = JSON.parse(template.variables);
        const userVars = typeof variables === 'string' ? JSON.parse(variables) : variables;
        
        // Replace variables in title and description
        Object.entries(userVars).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          processedTitle = processedTitle.replace(new RegExp(placeholder, 'g'), String(value));
          if (processedDescription) {
            processedDescription = processedDescription.replace(new RegExp(placeholder, 'g'), String(value));
          }
        });
      } catch (error) {
        console.error('Error processing template variables:', error);
      }
    }
    
    // Create the task
    const task = await prisma.task.create({
      data: {
        title: processedTitle,
        description: processedDescription,
        status: template.defaultStatus,
        priority: template.defaultPriority,
        estimatedHours: template.estimatedHours,
        isRecurring: template.isRecurring,
        recurringPattern: template.recurringPattern,
        tags: template.tags,
        deadline: deadline ? new Date(deadline) : null,
        projectId,
        experimentId,
        protocolId,
        noteId,
        templateId: template.id,
      },
      include: {
        project: true,
        experiment: true,
        protocol: true,
        note: true,
        template: true,
      }
    });
    
    // Increment usage count
    await prisma.taskTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task from template error:', error);
    res.status(500).json({ error: 'Failed to create task from template' });
  }
});

// Get template statistics
router.get('/stats/analytics', async (req, res) => {
  try {
    const totalTemplates = await prisma.taskTemplate.count();
    const totalUsage = await prisma.taskTemplate.aggregate({
      _sum: { usageCount: true }
    });
    
    const mostUsedTemplates = await prisma.taskTemplate.findMany({
      orderBy: { usageCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        usageCount: true,
        category: true
      }
    });
    
    const categoryStats = await prisma.taskTemplate.groupBy({
      by: ['category'],
      _count: { id: true },
      _sum: { usageCount: true }
    });
    
    const publicTemplates = await prisma.taskTemplate.count({
      where: { isPublic: true }
    });
    
    res.json({
      totalTemplates,
      totalUsage: totalUsage._sum.usageCount || 0,
      mostUsedTemplates,
      categoryStats,
      publicTemplates
    });
  } catch (error) {
    console.error('Get template stats error:', error);
    res.status(500).json({ error: 'Failed to get template statistics' });
  }
});

export default router; 