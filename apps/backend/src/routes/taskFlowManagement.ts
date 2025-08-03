import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Root task-flow-management endpoint
router.get('/', async (req, res) => {
    try {
        res.json({
            message: 'Task Flow Management API',
            endpoints: {
                workflows: 'GET /workflows',
                workflowById: 'GET /workflows/:id',
                createWorkflow: 'POST /workflows',
                updateWorkflow: 'PUT /workflows/:id',
                deleteWorkflow: 'DELETE /workflows/:id',
                executeWorkflow: 'POST /workflows/:id/execute'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Task Flow Management service error' });
    }
});

// Schema validation
const createWorkflowSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(['sequential', 'parallel', 'conditional', 'mixed']),
    nodes: z.array(z.object({
        id: z.string(),
        type: z.enum(['task', 'decision', 'start', 'end', 'subprocess', 'wait', 'notification']),
        position: z.object({
            x: z.number(),
            y: z.number()
        }),
        data: z.object({
            label: z.string(),
            taskId: z.string().optional(),
            taskTitle: z.string().optional(),
            condition: z.string().optional(),
            action: z.string().optional(),
            duration: z.number().optional(),
            notificationType: z.string().optional(),
            subprocessId: z.string().optional(),
            metadata: z.any().optional()
        })
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        type: z.enum(['default', 'conditional', 'parallel']),
        label: z.string().optional(),
        condition: z.string().optional(),
        style: z.any().optional()
    })),
    triggers: z.array(z.object({
        id: z.string(),
        type: z.enum(['manual', 'schedule', 'event', 'condition']),
        name: z.string(),
        config: z.object({
            schedule: z.string().optional(),
            eventType: z.string().optional(),
            condition: z.string().optional(),
            enabled: z.boolean()
        })
    })).optional(),
    rules: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['automation', 'validation', 'notification', 'escalation']),
        condition: z.string(),
        action: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        enabled: z.boolean()
    })).optional(),
    metadata: z.any().optional()
});

const updateWorkflowSchema = createWorkflowSchema.partial();

// Get all workflows
router.get('/workflows', async (req, res) => {
    try {
        const workflows = await prisma.taskWorkflow.findMany({
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: workflows
        });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflows'
        });
    }
});

// Get workflow by ID
router.get('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const workflow = await prisma.taskWorkflow.findUnique({
            where: { id },
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        workflowOrder: true
                    }
                }
            }
        });

        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }

        res.json({
            success: true,
            data: workflow
        });
    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflow'
        });
    }
});

// Create new workflow
router.post('/workflows', async (req, res) => {
    try {
        const validatedData = createWorkflowSchema.parse(req.body);

        const workflow = await prisma.taskWorkflow.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                metadata: JSON.stringify({
                    nodes: validatedData.nodes,
                    edges: validatedData.edges,
                    triggers: validatedData.triggers || [],
                    rules: validatedData.rules || []
                })
            }
        });

        res.json({
            success: true,
            data: workflow
        });
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create workflow'
        });
    }
});

// Update workflow
router.put('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateWorkflowSchema.parse(req.body);

        const workflow = await prisma.taskWorkflow.update({
            where: { id },
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : undefined,
                updatedAt: new Date()
            }
        });

        res.json({
            success: true,
            data: workflow
        });
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update workflow'
        });
    }
});

// Delete workflow
router.delete('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.taskWorkflow.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Workflow deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete workflow'
        });
    }
});

// Execute workflow
router.post('/workflows/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;

        // Get workflow
        const workflow = await prisma.taskWorkflow.findUnique({
            where: { id }
        });

        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: 'Workflow not found'
            });
        }

        // Create execution record
        const execution = await prisma.taskWorkflowExecution.create({
            data: {
                workflowId: id,
                status: 'running',
                startTime: new Date(),
                progress: 0,
                logs: JSON.stringify([])
            }
        });

        // Start execution in background (simulated)
        setTimeout(async () => {
            try {
                // Simulate workflow execution
                const metadata = JSON.parse(workflow.metadata || '{}');
                const nodes = metadata.nodes || [];

                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];

                    // Update progress
                    const progress = ((i + 1) / nodes.length) * 100;
                    await prisma.taskWorkflowExecution.update({
                        where: { id: execution.id },
                        data: {
                            progress,
                            currentNode: node.id,
                            logs: JSON.stringify([
                                {
                                    timestamp: new Date().toISOString(),
                                    level: 'info',
                                    message: `Processing node: ${node.data.label}`,
                                    nodeId: node.id
                                }
                            ])
                        }
                    });

                    // Simulate processing time
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // Mark as completed
                await prisma.taskWorkflowExecution.update({
                    where: { id: execution.id },
                    data: {
                        status: 'completed',
                        endTime: new Date(),
                        progress: 100
                    }
                });
            } catch (error) {
                console.error('Error during workflow execution:', error);
                await prisma.taskWorkflowExecution.update({
                    where: { id: execution.id },
                    data: {
                        status: 'failed',
                        endTime: new Date(),
                        logs: JSON.stringify([
                            {
                                timestamp: new Date().toISOString(),
                                level: 'error',
                                message: 'Workflow execution failed'
                            }
                        ])
                    }
                });
            }
        }, 100);

        res.json({
            success: true,
            data: {
                executionId: execution.id,
                message: 'Workflow execution started'
            }
        });
    } catch (error) {
        console.error('Error executing workflow:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute workflow'
        });
    }
});

// Get execution status
router.get('/executions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const execution = await prisma.taskWorkflowExecution.findUnique({
            where: { id }
        });

        if (!execution) {
            return res.status(404).json({
                success: false,
                error: 'Execution not found'
            });
        }

        res.json({
            success: true,
            data: {
                execution: {
                    id: execution.id,
                    flowId: execution.workflowId,
                    status: execution.status,
                    startTime: execution.startTime,
                    endTime: execution.endTime,
                    currentNode: execution.currentNode,
                    progress: execution.progress,
                    logs: JSON.parse(execution.logs || '[]')
                }
            }
        });
    } catch (error) {
        console.error('Error fetching execution status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch execution status'
        });
    }
});

// Get execution history
router.get('/executions', async (req, res) => {
    try {
        const { workflowId } = req.query;

        const where = workflowId ? { workflowId: workflowId as string } : {};

        const executions = await prisma.taskWorkflowExecution.findMany({
            where,
            orderBy: {
                startTime: 'desc'
            }
        });

        res.json({
            success: true,
            data: executions.map(execution => ({
                id: execution.id,
                flowId: execution.workflowId,
                status: execution.status,
                startTime: execution.startTime,
                endTime: execution.endTime,
                currentNode: execution.currentNode,
                progress: execution.progress,
                logs: JSON.parse(execution.logs || '[]')
            }))
        });
    } catch (error) {
        console.error('Error fetching execution history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch execution history'
        });
    }
});

// Pause execution
router.post('/executions/:id/pause', async (req, res) => {
    try {
        const { id } = req.params;

        const execution = await prisma.taskWorkflowExecution.update({
            where: { id },
            data: {
                status: 'paused'
            }
        });

        res.json({
            success: true,
            data: execution
        });
    } catch (error) {
        console.error('Error pausing execution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to pause execution'
        });
    }
});

// Resume execution
router.post('/executions/:id/resume', async (req, res) => {
    try {
        const { id } = req.params;

        const execution = await prisma.taskWorkflowExecution.update({
            where: { id },
            data: {
                status: 'running'
            }
        });

        res.json({
            success: true,
            data: execution
        });
    } catch (error) {
        console.error('Error resuming execution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resume execution'
        });
    }
});

// Cancel execution
router.post('/executions/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;

        const execution = await prisma.taskWorkflowExecution.update({
            where: { id },
            data: {
                status: 'cancelled',
                endTime: new Date()
            }
        });

        res.json({
            success: true,
            data: execution
        });
    } catch (error) {
        console.error('Error cancelling execution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel execution'
        });
    }
});

export default router; 