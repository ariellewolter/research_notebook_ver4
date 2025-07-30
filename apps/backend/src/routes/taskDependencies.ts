import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema validation
const createDependencySchema = z.object({
  fromTaskId: z.string(),
  toTaskId: z.string(),
  dependencyType: z.enum(['blocks', 'requires', 'suggests', 'relates']).default('blocks')
});

const createWorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['sequential', 'parallel', 'conditional', 'mixed']),
  taskIds: z.array(z.string()),
  metadata: z.string().optional()
});

// Get all dependencies for a task
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const dependencies = await prisma.taskDependency.findMany({
      where: {
        OR: [
          { fromTaskId: taskId },
          { toTaskId: taskId }
        ]
      },
      include: {
        fromTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        toTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    console.error('Error fetching task dependencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task dependencies'
    });
  }
});

// Create a new dependency
router.post('/', async (req, res) => {
  try {
    const validatedData = createDependencySchema.parse(req.body);
    
    // Check for circular dependencies
    const wouldCreateCycle = await checkForCircularDependency(
      validatedData.fromTaskId,
      validatedData.toTaskId
    );
    
    if (wouldCreateCycle) {
      return res.status(400).json({
        success: false,
        error: 'Creating this dependency would create a circular dependency'
      });
    }

    const dependency = await prisma.taskDependency.create({
      data: validatedData,
      include: {
        fromTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        toTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: dependency
    });
  } catch (error) {
    console.error('Error creating task dependency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task dependency'
    });
  }
});

// Delete a dependency
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.taskDependency.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Dependency deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task dependency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task dependency'
    });
  }
});

// Get critical path for a set of tasks
router.get('/critical-path', async (req, res) => {
  try {
    const { taskIds } = req.query;
    
    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({
        success: false,
        error: 'taskIds parameter is required and must be an array'
      });
    }

    const criticalPath = await calculateCriticalPath(taskIds as string[]);
    
    res.json({
      success: true,
      data: criticalPath
    });
  } catch (error) {
    console.error('Error calculating critical path:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate critical path'
    });
  }
});

// Workflow routes
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
            workflowOrder: true
          },
          orderBy: {
            workflowOrder: 'asc'
          }
        }
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

// Create a new workflow
router.post('/workflows', async (req, res) => {
  try {
    const validatedData = createWorkflowSchema.parse(req.body);
    
    const workflow = await prisma.taskWorkflow.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        metadata: validatedData.metadata,
        tasks: {
          connect: validatedData.taskIds.map((taskId, index) => ({
            id: taskId,
            workflowOrder: index + 1
          }))
        }
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            workflowOrder: true
          },
          orderBy: {
            workflowOrder: 'asc'
          }
        }
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
            workflowOrder: true,
            priority: true,
            deadline: true,
            dependencies: {
              include: {
                fromTask: {
                  select: {
                    id: true,
                    title: true,
                    status: true
                  }
                }
              }
            }
          },
          orderBy: {
            workflowOrder: 'asc'
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

// Helper function to check for circular dependencies
async function checkForCircularDependency(fromTaskId: string, toTaskId: string): Promise<boolean> {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  async function dfs(taskId: string): Promise<boolean> {
    if (recursionStack.has(taskId)) {
      return true; // Circular dependency found
    }
    
    if (visited.has(taskId)) {
      return false;
    }

    visited.add(taskId);
    recursionStack.add(taskId);

    // Get all tasks that this task depends on
    const dependencies = await prisma.taskDependency.findMany({
      where: { fromTaskId: taskId }
    });

    for (const dep of dependencies) {
      if (await dfs(dep.toTaskId)) {
        return true;
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  return dfs(toTaskId);
}

// Helper function to calculate critical path
async function calculateCriticalPath(taskIds: string[]) {
  const tasks = await prisma.task.findMany({
    where: {
      id: { in: taskIds }
    },
    include: {
      dependencies: {
        include: {
          toTask: true
        }
      }
    }
  });

  // Simple critical path calculation
  // In a real implementation, this would be more sophisticated
  const taskMap = new Map(tasks.map(task => [task.id, task]));
  const criticalPath: string[] = [];
  const visited = new Set<string>();

  function findLongestPath(taskId: string): number {
    if (visited.has(taskId)) {
      return 0;
    }

    visited.add(taskId);
    const task = taskMap.get(taskId);
    if (!task) return 0;

    let maxPath = 1; // Base duration
    for (const dep of task.dependencies) {
      maxPath = Math.max(maxPath, 1 + findLongestPath(dep.toTaskId));
    }

    return maxPath;
  }

  // Find the task with the longest path
  let maxPath = 0;
  let criticalTaskId = '';

  for (const taskId of taskIds) {
    const pathLength = findLongestPath(taskId);
    if (pathLength > maxPath) {
      maxPath = pathLength;
      criticalTaskId = taskId;
    }
  }

  // Reconstruct the critical path
  visited.clear();
  function reconstructPath(taskId: string): string[] {
    if (visited.has(taskId)) return [];
    visited.add(taskId);

    const task = taskMap.get(taskId);
    if (!task) return [];

    const path = [taskId];
    let maxSubPath: string[] = [];

    for (const dep of task.dependencies) {
      const subPath = reconstructPath(dep.toTaskId);
      if (subPath.length > maxSubPath.length) {
        maxSubPath = subPath;
      }
    }

    return [...path, ...maxSubPath];
  }

  return {
    criticalPath: reconstructPath(criticalTaskId),
    duration: maxPath,
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dependencies: task.dependencies.map(dep => dep.toTaskId)
    }))
  };
}

export default router; 