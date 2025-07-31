import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// JWT secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Encryption key for OAuth credentials (should be in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Utility functions for encryption/decryption
const encrypt = (text: string): string => {
  if (!text) return text;
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: username }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token middleware
export const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Add endpoints for Google Calendar credentials
router.post('/user/google-credentials', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { googleClientId, googleClientSecret } = req.body;
        
        // Encrypt sensitive credentials before storing
        const encryptedClientSecret = encrypt(googleClientSecret);
        
        await prisma.user.update({
            where: { id: userId },
            data: {
                googleClientId, // Client ID is not sensitive, can be stored as plaintext
                googleClientSecret: encryptedClientSecret
            }
        });
        res.status(200).json({ message: 'Google credentials saved.' });
    } catch (error) {
        console.error('Save Google credentials error:', error);
        res.status(500).json({ error: 'Failed to save Google credentials' });
    }
});

router.get('/user/google-credentials', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleClientId: true, googleClientSecret: true }
        });
        
        // Decrypt sensitive credentials before returning
        const decryptedClientSecret = user?.googleClientSecret ? decrypt(user.googleClientSecret) : '';
        
        res.status(200).json({
            googleClientId: user?.googleClientId || '',
            googleClientSecret: decryptedClientSecret
        });
    } catch (error) {
        console.error('Get Google credentials error:', error);
        res.status(500).json({ error: 'Failed to get Google credentials' });
    }
});

// Add endpoints for Outlook Calendar credentials
router.post('/user/outlook-credentials', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { outlookClientId, outlookClientSecret } = req.body;
        
        // Encrypt sensitive credentials before storing
        const encryptedClientSecret = encrypt(outlookClientSecret);
        
        await prisma.user.update({
            where: { id: userId },
            data: {
                outlookClientId, // Client ID is not sensitive, can be stored as plaintext
                outlookClientSecret: encryptedClientSecret
            }
        });
        res.status(200).json({ message: 'Outlook credentials saved.' });
    } catch (error) {
        console.error('Save Outlook credentials error:', error);
        res.status(500).json({ error: 'Failed to save Outlook credentials' });
    }
});

router.get('/user/outlook-credentials', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { outlookClientId: true, outlookClientSecret: true, outlookTokens: true }
        });
        
        // Decrypt sensitive credentials before returning
        const decryptedClientSecret = user?.outlookClientSecret ? decrypt(user.outlookClientSecret) : '';
        
        res.json({
            outlookClientId: user?.outlookClientId || '',
            outlookClientSecret: decryptedClientSecret,
            outlookTokens: user?.outlookTokens || null
        });
    } catch (error) {
        console.error('Get Outlook credentials error:', error);
        res.status(500).json({ error: 'Failed to get Outlook credentials' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 