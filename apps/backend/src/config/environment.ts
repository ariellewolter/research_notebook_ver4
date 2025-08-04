import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3001'),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().optional(),
    ZOTERO_API_KEY: z.string().optional(),
    ZOTERO_USER_ID: z.string().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
    environment: env.NODE_ENV,
    port: env.PORT,
    database: {
        url: env.DATABASE_URL,
    },
    jwt: {
        secret: env.JWT_SECRET || 'default-secret-key',
    },
    zotero: {
        apiKey: env.ZOTERO_API_KEY,
        userId: env.ZOTERO_USER_ID,
    },
} as const;

export type Config = typeof config; 