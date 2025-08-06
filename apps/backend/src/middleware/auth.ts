import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
    userId: string;
    email: string;
    role?: string;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access token required',
            statusCode: 401 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        (req as any).user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'user'
        };
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ 
            success: false, 
            error: 'Invalid or expired token',
            statusCode: 403 
        });
    }
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
} 