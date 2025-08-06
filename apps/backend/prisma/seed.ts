import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin'
        }
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const regularUser = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            username: 'user',
            email: 'user@example.com',
            password: userPassword,
            role: 'member'
        }
    });

    console.log('✅ Database seeded successfully!');
    console.log('👤 Admin user created:', adminUser.username);
    console.log('👤 Regular user created:', regularUser.username);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 