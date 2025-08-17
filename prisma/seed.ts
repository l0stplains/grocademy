import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grocademy.local' },
    update: {},
    create: {
      email: 'admin@grocademy.local',
      username: 'admin',
      firstName: 'Gro',
      lastName: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
      balance: 0,
    },
  });

  // demo user
  const userPassword = await bcrypt.hash('user12345', 10);
  const user = await prisma.user.upsert({
    where: { email: 'student@grocademy.local' },
    update: {},
    create: {
      email: 'student@grocademy.local',
      username: 'student1',
      firstName: 'Student',
      lastName: 'One',
      password: userPassword,
      role: 'USER',
      balance: 200, // to buy a course
    },
  });

  // sample courses
  const courseA = await prisma.course.create({
    data: {
      title: 'Intro to Network Security',
      description: 'Basics of networking, threats, and defenses.',
      instructor: 'Awan Mengawang',
      topics: ['networking', 'security', 'tcp/ip'],
      price: 120,
      thumbnailImage: null,
      modules: {
        create: [
          {
            title: 'OSI Model',
            description: 'Layers & purpose',
            order: 1,
            pdfContent: null,
            videoContent: null,
          },
          {
            title: 'TCP vs UDP',
            description: 'Tradeoffs',
            order: 2,
            pdfContent: null,
            videoContent: null,
          },
          {
            title: 'Firewalls',
            description: 'Filtering & rules',
            order: 3,
            pdfContent: null,
            videoContent: null,
          },
        ],
      },
    },
    include: { modules: true },
  });

  const courseB = await prisma.course.create({
    data: {
      title: 'Practical Cryptography',
      description: 'From ciphers to protocols.',
      instructor: 'Naya Kagha Na',
      topics: ['crypto', 'hashing', 'rsa'],
      price: 90,
      thumbnailImage: null,
      modules: {
        create: [
          {
            title: 'Classical Ciphers',
            description: 'Vigenere, etc.',
            order: 1,
          },
          { title: 'Modern Primitives', description: 'AES, SHA', order: 2 },
        ],
      },
    },
  });

  // give the student one enrollment to start with
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: courseB.id } },
    update: {},
    create: { userId: user.id, courseId: courseB.id },
  });

  console.log('Seed done:', {
    admin: admin.email,
    user: user.email,
    courseA: courseA.title,
    courseB: courseB.title,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
