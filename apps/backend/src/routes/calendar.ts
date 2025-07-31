import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth';
import { google } from 'googleapis';

const router = express.Router();
const prisma = new PrismaClient();

// Google Calendar OAuth2 endpoints
router.get('/google/auth', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user's Google credentials
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleClientId: true, googleClientSecret: true }
        });

        if (!user?.googleClientId || !user?.googleClientSecret) {
            return res.status(400).json({ 
                error: 'Google credentials not configured. Please set up your Google API credentials in Settings.' 
            });
        }

        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            user.googleClientId,
            user.googleClientSecret,
            process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/calendar/callback` : 'http://localhost:5173/calendar/callback' // Frontend callback URL
        );

        // Generate authorization URL
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events'
            ],
            prompt: 'consent'
        });

        res.json({ authUrl });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Failed to start Google authentication' });
    }
});

router.get('/google/callback', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }

        // Get user's Google credentials
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleClientId: true, googleClientSecret: true }
        });

        if (!user?.googleClientId || !user?.googleClientSecret) {
            return res.status(400).json({ error: 'Google credentials not configured' });
        }

        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            user.googleClientId,
            user.googleClientSecret,
            'http://localhost:5173/calendar/callback'
        );

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code as string);

        // Store tokens in database (encrypted in production)
        await prisma.user.update({
            where: { id: userId },
            data: {
                googleTokens: JSON.stringify(tokens)
            }
        });

        res.json({ 
            message: 'Google Calendar connected successfully!',
            hasTokens: true
        });
    } catch (error) {
        console.error('Google callback error:', error);
        res.status(500).json({ error: 'Failed to complete Google authentication' });
    }
});

router.get('/google/calendars', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Get user's Google credentials and tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleClientId: true, googleClientSecret: true, googleTokens: true }
        });

        if (!user?.googleClientId || !user?.googleClientSecret || !user?.googleTokens) {
            return res.status(400).json({ error: 'Google Calendar not connected' });
        }

        // Create OAuth2 client and set tokens
        const oauth2Client = new google.auth.OAuth2(
            user.googleClientId,
            user.googleClientSecret
        );

        const tokens = JSON.parse(user.googleTokens);
        oauth2Client.setCredentials(tokens);

        // Create Calendar API client
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Get user's calendars
        const response = await calendar.calendarList.list();
        const calendars = response.data.items?.map(cal => ({
            id: cal.id,
            name: cal.summary,
            description: cal.description,
            primary: cal.primary,
            accessRole: cal.accessRole,
            backgroundColor: cal.backgroundColor,
            foregroundColor: cal.foregroundColor
        })) || [];

        res.json({ calendars });
    } catch (error) {
        console.error('Get calendars error:', error);
        res.status(500).json({ error: 'Failed to fetch calendars' });
    }
});

router.post('/google/sync', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { calendarIds } = req.body;

        if (!calendarIds || !Array.isArray(calendarIds)) {
            return res.status(400).json({ error: 'Calendar IDs array is required' });
        }

        // Get user's Google credentials and tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleClientId: true, googleClientSecret: true, googleTokens: true }
        });

        if (!user?.googleClientId || !user?.googleClientSecret || !user?.googleTokens) {
            return res.status(400).json({ error: 'Google Calendar not connected' });
        }

        // Create OAuth2 client and set tokens
        const oauth2Client = new google.auth.OAuth2(
            user.googleClientId,
            user.googleClientSecret
        );

        const tokens = JSON.parse(user.googleTokens);
        oauth2Client.setCredentials(tokens);

        // Create Calendar API client
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Get events from selected calendars
        const allEvents = [];
        const now = new Date();
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        for (const calendarId of calendarIds) {
            try {
                const response = await calendar.events.list({
                    calendarId,
                    timeMin: now.toISOString(),
                    timeMax: oneMonthFromNow.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime'
                });

                const events = response.data.items?.map(event => ({
                    id: event.id,
                    title: event.summary,
                    description: event.description,
                    start: event.start?.dateTime || event.start?.date,
                    end: event.end?.dateTime || event.end?.date,
                    calendarId,
                    location: event.location,
                    attendees: event.attendees?.map(a => a.email) || []
                })) || [];

                allEvents.push(...events);
            } catch (error) {
                console.error(`Error fetching events from calendar ${calendarId}:`, error);
            }
        }

        res.json({ 
            message: 'Calendar sync completed',
            events: allEvents,
            count: allEvents.length
        });
    } catch (error) {
        console.error('Calendar sync error:', error);
        res.status(500).json({ error: 'Failed to sync calendars' });
    }
});

router.post('/google/events', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { calendarId, event } = req.body;

        if (!calendarId || !event) {
            return res.status(400).json({ error: 'Calendar ID and event data are required' });
        }

        // Get user's Google credentials and tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { googleClientId: true, googleClientSecret: true, googleTokens: true }
        });

        if (!user?.googleClientId || !user?.googleClientSecret || !user?.googleTokens) {
            return res.status(400).json({ error: 'Google Calendar not connected' });
        }

        // Create OAuth2 client and set tokens
        const oauth2Client = new google.auth.OAuth2(
            user.googleClientId,
            user.googleClientSecret
        );

        const tokens = JSON.parse(user.googleTokens);
        oauth2Client.setCredentials(tokens);

        // Create Calendar API client
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Create event in Google Calendar
        const response = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary: event.title,
                description: event.description,
                start: {
                    dateTime: event.start,
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: event.end,
                    timeZone: 'UTC'
                },
                location: event.location
            }
        });

        res.json({ 
            message: 'Event created successfully',
            event: response.data
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Outlook Calendar OAuth2 endpoints
router.get('/outlook/auth', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user's Outlook credentials
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { outlookClientId: true, outlookClientSecret: true }
        });

        if (!user?.outlookClientId || !user?.outlookClientSecret) {
            return res.status(400).json({ 
                error: 'Outlook credentials not configured. Please set up your Microsoft API credentials in Settings.' 
            });
        }

        // Create OAuth2 authorization URL for Microsoft Graph
        const redirectUri = 'http://localhost:5173/calendar/callback';
        const scope = 'https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read';
        const responseType = 'code';
        const clientId = user.outlookClientId;

        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${encodeURIComponent(clientId)}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `response_type=${responseType}&` +
            `response_mode=query`;

        res.json({ authUrl });
    } catch (error) {
        console.error('Outlook auth error:', error);
        res.status(500).json({ error: 'Failed to start Outlook authentication' });
    }
});

router.get('/outlook/callback', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }

        // Get user's Outlook credentials
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { outlookClientId: true, outlookClientSecret: true }
        });

        if (!user?.outlookClientId || !user?.outlookClientSecret) {
            return res.status(400).json({ error: 'Outlook credentials not configured' });
        }

        // Exchange code for tokens using Microsoft Graph API
        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: user.outlookClientId,
                client_secret: user.outlookClientSecret,
                code: code as string,
                grant_type: 'authorization_code',
                redirect_uri: 'http://localhost:5173/calendar/callback',
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Token exchange error:', errorData);
            return res.status(400).json({ error: 'Failed to exchange authorization code for tokens' });
        }

        const tokens = await tokenResponse.json();

        // Store tokens in database (encrypted in production)
        await prisma.user.update({
            where: { id: userId },
            data: {
                outlookTokens: JSON.stringify(tokens)
            }
        });

        res.json({ 
            message: 'Outlook Calendar connected successfully!',
            hasTokens: true
        });
    } catch (error) {
        console.error('Outlook callback error:', error);
        res.status(500).json({ error: 'Failed to complete Outlook authentication' });
    }
});

router.get('/outlook/calendars', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Get user's Outlook credentials and tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { outlookClientId: true, outlookClientSecret: true, outlookTokens: true }
        });

        if (!user?.outlookClientId || !user?.outlookClientSecret || !user?.outlookTokens) {
            return res.status(400).json({ error: 'Outlook Calendar not connected' });
        }

        const tokens = JSON.parse(user.outlookTokens);

        // Get user's calendars using Microsoft Graph API
        const calendarsResponse = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!calendarsResponse.ok) {
            return res.status(400).json({ error: 'Failed to fetch Outlook calendars' });
        }

        const calendarsData = await calendarsResponse.json();
        const calendars = calendarsData.value.map((calendar: any) => ({
            id: calendar.id,
            name: calendar.name,
            description: calendar.description,
            primary: calendar.isDefaultCalendar || false,
            accessRole: calendar.canEdit ? 'writer' : 'reader',
            backgroundColor: calendar.color || '#0078d4',
            foregroundColor: '#ffffff'
        }));

        res.json({ calendars });
    } catch (error) {
        console.error('Get Outlook calendars error:', error);
        res.status(500).json({ error: 'Failed to fetch Outlook calendars' });
    }
});

router.post('/outlook/sync', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { calendarIds } = req.body;

        if (!calendarIds || !Array.isArray(calendarIds)) {
            return res.status(400).json({ error: 'Calendar IDs array is required' });
        }

        // Get user's Outlook credentials and tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { outlookClientId: true, outlookClientSecret: true, outlookTokens: true }
        });

        if (!user?.outlookClientId || !user?.outlookClientSecret || !user?.outlookTokens) {
            return res.status(400).json({ error: 'Outlook Calendar not connected' });
        }

        const tokens = JSON.parse(user.outlookTokens);

        // Get events from selected calendars
        const allEvents = [];
        const now = new Date();
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        for (const calendarId of calendarIds) {
            try {
                const response = await fetch(
                    `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events?` +
                    `$filter=start/dateTime ge '${now.toISOString()}' and end/dateTime le '${oneMonthFromNow.toISOString()}'&` +
                    `$orderby=start/dateTime`,
                    {
                        headers: {
                            'Authorization': `Bearer ${tokens.access_token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const events = data.value.map((event: any) => ({
                        id: event.id,
                        title: event.subject,
                        description: event.body?.content || '',
                        start: event.start?.dateTime,
                        end: event.end?.dateTime,
                        calendarId,
                        location: event.location?.displayName || '',
                        attendees: event.attendees?.map((a: any) => a.emailAddress?.address) || []
                    }));
                    allEvents.push(...events);
                }
            } catch (error) {
                console.error(`Error fetching events from calendar ${calendarId}:`, error);
            }
        }

        res.json({ 
            message: 'Outlook Calendar sync completed',
            events: allEvents,
            count: allEvents.length
        });
    } catch (error) {
        console.error('Outlook Calendar sync error:', error);
        res.status(500).json({ error: 'Failed to sync Outlook calendars' });
    }
});

router.post('/outlook/events', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { calendarId, event } = req.body;

        if (!calendarId || !event) {
            return res.status(400).json({ error: 'Calendar ID and event data are required' });
        }

        // Get user's Outlook credentials and tokens
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { outlookClientId: true, outlookClientSecret: true, outlookTokens: true }
        });

        if (!user?.outlookClientId || !user?.outlookClientSecret || !user?.outlookTokens) {
            return res.status(400).json({ error: 'Outlook Calendar not connected' });
        }

        const tokens = JSON.parse(user.outlookTokens);

        // Create event in Outlook Calendar using Microsoft Graph API
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject: event.title,
                body: {
                    contentType: 'text',
                    content: event.description || ''
                },
                start: {
                    dateTime: event.start,
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: event.end,
                    timeZone: 'UTC'
                },
                location: {
                    displayName: event.location || ''
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Create event error:', errorData);
            return res.status(400).json({ error: 'Failed to create event in Outlook Calendar' });
        }

        const createdEvent = await response.json();

        res.json({ 
            message: 'Event created successfully',
            event: createdEvent
        });
    } catch (error) {
        console.error('Create Outlook event error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Apple Calendar ICS Feed Export
router.get('/apple/ics', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;

        // Get user's experiments, protocols, tasks, and notes for the date range
        const start = startDate ? new Date(startDate as string) : new Date();
        const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Fetch events from database
        const [experiments, protocols, tasks, notes] = await Promise.all([
            prisma.experiment.findMany({
                where: {
                    project: { userId },
                    createdAt: { gte: start, lte: end }
                },
                include: { project: true }
            }),
            prisma.protocol.findMany({
                where: {
                    createdAt: { gte: start, lte: end }
                }
            }),
            prisma.task.findMany({
                where: {
                    project: { userId },
                    createdAt: { gte: start, lte: end }
                },
                include: { project: true }
            }),
            prisma.note.findMany({
                where: {
                    experiment: {
                        project: { userId }
                    },
                    createdAt: { gte: start, lte: end }
                },
                include: { experiment: { include: { project: true } } }
            })
        ]);

        // Generate ICS content
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Research Notebook//Calendar Export//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        // Add experiments
        experiments.forEach(exp => {
            const startDate = new Date(exp.createdAt);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:exp-${exp.id}@research-notebook`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `SUMMARY:${exp.name || 'Experiment'}`,
                `DESCRIPTION:${exp.description || ''} (Project: ${(exp.project && exp.project.name) || 'Unknown'})`,
                'CATEGORIES:Experiment',
                'END:VEVENT'
            );
        });

        // Add protocols
        protocols.forEach(protocol => {
            const startDate = new Date(protocol.createdAt);
            const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes duration
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:protocol-${protocol.id}@research-notebook`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `SUMMARY:${protocol.name || 'Protocol'}`,
                `DESCRIPTION:${protocol.description || ''}`,
                'CATEGORIES:Protocol',
                'END:VEVENT'
            );
        });

        // Add tasks
        tasks.forEach(task => {
            const startDate = new Date(task.createdAt);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:task-${task.id}@research-notebook`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `SUMMARY:${task.title || 'Task'}`,
                `DESCRIPTION:${task.description || ''} (Project: ${(task.project && task.project.name) || 'Unknown'})`,
                'CATEGORIES:Task',
                'END:VEVENT'
            );
        });

        // Add notes
        notes.forEach(note => {
            const startDate = new Date(note.createdAt);
            const endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // 15 minutes duration
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:note-${note.id}@research-notebook`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                `SUMMARY:${note.title || 'Note'}`,
                `DESCRIPTION:${note.content || ''} (Project: ${note.experiment?.project.name || 'Unknown'})`,
                'CATEGORIES:Note',
                'END:VEVENT'
            );
        });

        icsContent.push('END:VCALENDAR');

        // Set response headers for ICS file download
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="research-notebook-calendar.ics"');
        res.send(icsContent.join('\r\n'));
    } catch (error) {
        console.error('ICS export error:', error);
        res.status(500).json({ error: 'Failed to export calendar' });
    }
});

export default router; 