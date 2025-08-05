import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Blocks API', () => {
    let testNoteId: string;
    let testProjectId: string;
    let testBlockId: string;

    beforeAll(async () => {
        // Create test entities
        const note = await prisma.note.create({
            data: {
                title: 'Test Note for Blocks',
                content: 'Test content',
                type: 'experiment'
            }
        });
        testNoteId = note.id;

        const project = await prisma.project.create({
            data: {
                name: 'Test Project for Blocks',
                description: 'Test project description',
                userId: 'test-user-id'
            }
        });
        testProjectId = project.id;
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.freeformDrawingBlock.deleteMany({
            where: {
                entityId: { in: [testNoteId, testProjectId] }
            }
        });
        await prisma.note.delete({ where: { id: testNoteId } });
        await prisma.project.delete({ where: { id: testProjectId } });
        await prisma.$disconnect();
    });

    describe('POST /api/blocks/freeform', () => {
        it('should create a new freeform drawing block', async () => {
            const blockData = {
                blockId: 'test-block-1',
                entityId: testNoteId,
                entityType: 'note' as const,
                strokes: JSON.stringify([
                    {
                        id: 'stroke-1',
                        points: [{ x: 10, y: 10, timestamp: Date.now() }],
                        color: '#000000',
                        width: 2,
                        opacity: 1
                    }
                ]),
                svgPath: '<svg>...</svg>',
                pngThumbnail: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                width: 600,
                height: 400
            };

            const response = await request(app)
                .post('/api/blocks/freeform')
                .send(blockData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.blockId).toBe(blockData.blockId);
            expect(response.body.entityId).toBe(testNoteId);
            expect(response.body.entityType).toBe('note');

            testBlockId = response.body.blockId;
        });

        it('should reject duplicate blockId', async () => {
            const blockData = {
                blockId: testBlockId, // Use existing blockId
                entityId: testNoteId,
                entityType: 'note' as const,
                strokes: '[]',
                svgPath: '',
                pngThumbnail: '',
                width: 600,
                height: 400
            };

            await request(app)
                .post('/api/blocks/freeform')
                .send(blockData)
                .expect(409);
        });

        it('should reject invalid entity type', async () => {
            const blockData = {
                blockId: 'test-block-invalid',
                entityId: testNoteId,
                entityType: 'invalid' as any,
                strokes: '[]',
                svgPath: '',
                pngThumbnail: '',
                width: 600,
                height: 400
            };

            await request(app)
                .post('/api/blocks/freeform')
                .send(blockData)
                .expect(400);
        });
    });

    describe('GET /api/blocks/:entityType/:entityId/freeform', () => {
        it('should get freeform drawing blocks for a note', async () => {
            const response = await request(app)
                .get(`/api/blocks/note/${testNoteId}/freeform`)
                .expect(200);

            expect(response.body).toHaveProperty('blocks');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.blocks)).toBe(true);
            expect(response.body.blocks.length).toBeGreaterThan(0);
        });

        it('should return empty array for non-existent entity', async () => {
            const response = await request(app)
                .get('/api/blocks/note/non-existent-id/freeform')
                .expect(200);

            expect(response.body.blocks).toEqual([]);
            expect(response.body.pagination.total).toBe(0);
        });

        it('should reject invalid entity type', async () => {
            await request(app)
                .get('/api/blocks/invalid/test-id/freeform')
                .expect(400);
        });
    });

    describe('GET /api/blocks/freeform/:blockId', () => {
        it('should get a specific freeform drawing block', async () => {
            const response = await request(app)
                .get(`/api/blocks/freeform/${testBlockId}`)
                .expect(200);

            expect(response.body.blockId).toBe(testBlockId);
            expect(response.body.entityId).toBe(testNoteId);
            expect(response.body.entityType).toBe('note');
        });

        it('should return 404 for non-existent block', async () => {
            await request(app)
                .get('/api/blocks/freeform/non-existent-block')
                .expect(404);
        });
    });

    describe('PUT /api/blocks/freeform/:blockId', () => {
        it('should update a freeform drawing block', async () => {
            const updateData = {
                strokes: JSON.stringify([
                    {
                        id: 'stroke-2',
                        points: [{ x: 20, y: 20, timestamp: Date.now() }],
                        color: '#FF0000',
                        width: 3,
                        opacity: 0.8
                    }
                ]),
                svgPath: '<svg updated>...</svg>',
                width: 800,
                height: 600
            };

            const response = await request(app)
                .put(`/api/blocks/freeform/${testBlockId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.strokes).toBe(updateData.strokes);
            expect(response.body.svgPath).toBe(updateData.svgPath);
            expect(response.body.width).toBe(updateData.width);
            expect(response.body.height).toBe(updateData.height);
        });

        it('should return 404 for non-existent block', async () => {
            await request(app)
                .put('/api/blocks/freeform/non-existent-block')
                .send({ strokes: '[]' })
                .expect(404);
        });
    });

    describe('DELETE /api/blocks/freeform/:blockId', () => {
        it('should delete a freeform drawing block', async () => {
            await request(app)
                .delete(`/api/blocks/freeform/${testBlockId}`)
                .expect(204);
        });

        it('should return 404 for non-existent block', async () => {
            await request(app)
                .delete('/api/blocks/freeform/non-existent-block')
                .expect(404);
        });
    });

    describe('GET /api/blocks/freeform/stats', () => {
        it('should get statistics for freeform drawing blocks', async () => {
            const response = await request(app)
                .get('/api/blocks/freeform/stats')
                .expect(200);

            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('byEntityType');
            expect(response.body).toHaveProperty('recent');
            expect(typeof response.body.total).toBe('number');
            expect(typeof response.body.byEntityType).toBe('object');
            expect(Array.isArray(response.body.recent)).toBe(true);
        });
    });

    describe('POST /api/blocks/freeform/bulk', () => {
        it('should create multiple freeform drawing blocks', async () => {
            const blocksData = [
                {
                    blockId: 'bulk-block-1',
                    entityId: testNoteId,
                    entityType: 'note' as const,
                    strokes: '[]',
                    svgPath: '',
                    pngThumbnail: '',
                    width: 600,
                    height: 400
                },
                {
                    blockId: 'bulk-block-2',
                    entityId: testProjectId,
                    entityType: 'project' as const,
                    strokes: '[]',
                    svgPath: '',
                    pngThumbnail: '',
                    width: 800,
                    height: 600
                }
            ];

            const response = await request(app)
                .post('/api/blocks/freeform/bulk')
                .send({ blocks: blocksData })
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('count');
            expect(response.body.count).toBe(2);
        });
    });

    describe('GET /api/blocks/freeform/search', () => {
        it('should search freeform drawing blocks', async () => {
            const response = await request(app)
                .get('/api/blocks/freeform/search?q=bulk-block&entityType=note')
                .expect(200);

            expect(response.body).toHaveProperty('blocks');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.blocks)).toBe(true);
        });
    });
}); 