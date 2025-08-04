import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error:', error);

    // Zod validation errors
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation error',
            details: error.errors,
            statusCode: 400,
        });
        return;
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                res.status(409).json({
                    success: false,
                    error: 'A record with this data already exists',
                    statusCode: 409,
                });
                return;
            case 'P2025':
                res.status(404).json({
                    success: false,
                    error: 'Record not found',
                    statusCode: 404,
                });
                return;
            default:
                res.status(500).json({
                    success: false,
                    error: 'Database error',
                    statusCode: 500,
                });
                return;
        }
    }

    // Custom application errors
    if (error.message === 'Project not found') {
        res.status(404).json({
            success: false,
            error: error.message,
            statusCode: 404,
        });
        return;
    }

    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        statusCode: 500,
    });
} 