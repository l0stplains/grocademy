import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type FixedCourse = {
  title: string;
  description: string;
  instructor: string;
  topics: string[];
  price: number;
  modules: { title: string; description: string }[];
};

const COURSES: FixedCourse[] = [
  {
    title: 'NestJS Fundamentals',
    description:
      'Learn the core building blocks of NestJS: modules, controllers, providers, DI, pipes, filters and guards. Build a clean, testable REST API.',
    instructor: 'Ari Wibowo',
    topics: ['nestjs', 'nodejs', 'typescript', 'rest api'],
    price: 79,
    modules: [
      { title: 'Intro & Project Structure', description: 'Nest philosophy, folder layout, first controller & service.' },
      { title: 'Modules & Dependency Injection', description: 'Providers, DI scopes, module boundaries.' },
      { title: 'Pipes, Filters & Interceptors', description: 'Validation, error shaping, cross-cutting concerns.' },
      { title: 'Guards & Auth Basics', description: 'Route protection, custom guards, roles.' },
      { title: 'Configuration & Env', description: 'ConfigModule, schema validation, best practices.' },
      { title: 'Building a REST API', description: 'DTOs, versioning, pagination and error contracts.' },
    ],
  },
  {
    title: 'TypeScript for Backend Engineers',
    description:
      'Practical TypeScript for Node: types, generics, utility types, narrowing, and organizing large codebases.',
    instructor: 'Nadya Putri',
    topics: ['typescript', 'nodejs', 'typing', 'generics'],
    price: 59,
    modules: [
      { title: 'Type System Essentials', description: 'Primitives, unions, interfaces vs types.' },
      { title: 'Functions & Generics', description: 'Generic functions, constraints, inference.' },
      { title: 'Narrowing & Guards', description: 'Control flow analysis, user-defined type guards.' },
      { title: 'Utility Types & Mapped Types', description: 'Partial, Pick, Record, Readonly and more.' },
      { title: 'Project Organization', description: 'Paths, tsconfig, linting and conventions.' },
    ],
  },
  {
    title: 'PostgreSQL Essentials',
    description:
      'Master SQL querying, indexing, transactions and basic tuning in PostgreSQL for reliable backends.',
    instructor: 'Dewi Rahayu',
    topics: ['postgresql', 'sql', 'indexes', 'transactions'],
    price: 69,
    modules: [
      { title: 'Relational Modeling', description: 'Keys, relationships, normalization trade-offs.' },
      { title: 'Querying with SQL', description: 'SELECT, JOINs, GROUP BY, window functions.' },
      { title: 'Indexes & Performance', description: 'B-Tree, partial, covering indexes, EXPLAIN.' },
      { title: 'Transactions & Concurrency', description: 'ACID, isolation levels, locks.' },
      { title: 'Migrations & Maintenance', description: 'Migration strategy, VACUUM, backups.' },
    ],
  },
  {
    title: 'Prisma ORM Deep Dive',
    description:
      'Use Prisma with PostgreSQL: schema modeling, relations, migrations, transactions, and performance tips.',
    instructor: 'Bagus Santoso',
    topics: ['prisma', 'orm', 'postgresql', 'migrations'],
    price: 69,
    modules: [
      { title: 'Schema Modeling', description: 'Models, enums, relations, @unique and indexes.' },
      { title: 'Migrations', description: 'Dev vs deploy, drift, safe changes.' },
      { title: 'Queries & Transactions', description: 'CRUD patterns, $transaction, error handling.' },
      { title: 'Performance & N+1', description: 'select/include, batching, pagination.' },
      { title: 'Testing with Prisma', description: 'Test DB setup, seeding, fixtures.' },
    ],
  },
  {
    title: 'Authentication & JWT in NestJS',
    description:
      'Implement robust login using bcrypt, JWT, guards, and best practices for token handling.',
    instructor: 'Yusuf Ramadhan',
    topics: ['auth', 'jwt', 'security', 'cookies'],
    price: 49,
    modules: [
      { title: 'Password Storage', description: 'Hashing with bcrypt, peppering and iteration cost.' },
      { title: 'JWT Fundamentals', description: 'Claims, expiry, signing, pitfalls.' },
      { title: 'Guards & Strategies', description: 'Passport strategies, custom guards.' },
      { title: 'Session vs Token', description: 'Cookies, CSRF, HttpOnly, refresh vs access.' },
      { title: 'Hardening', description: 'Rate limits, lockouts, audit logs.' },
    ],
  },
  {
    title: 'REST API Design & Best Practices',
    description:
      'Design clean APIs: resources, error contracts, pagination, filtering, idempotency and versioning.',
    instructor: 'Rani Prameswari',
    topics: ['rest api', 'http', 'validation', 'pagination'],
    price: 79,
    modules: [
      { title: 'Resource Modeling', description: 'Nouns, relationships, URIs, hypermedia hints.' },
      { title: 'Request/Response Shape', description: 'DTOs, error envelopes, validation.' },
      { title: 'Pagination & Filtering', description: 'Cursor vs offset, consistency, perf.' },
      { title: 'Versioning & Compatibility', description: 'URI vs header, deprecation strategy.' },
      { title: 'Idempotency & Safety', description: 'HTTP semantics, retries, idempotency keys.' },
    ],
  },
  {
    title: 'Docker for Monolith Deployment',
    description:
      'Containerize your Nest monolith with Docker & docker-compose. Optimize image size and boot time.',
    instructor: 'Rahmat Hidayat',
    topics: ['docker', 'docker-compose', 'containers'],
    price: 49,
    modules: [
      { title: 'Docker Basics', description: 'Images, layers, registries, networking.' },
      { title: 'Writing a Dockerfile', description: 'Multi-stage builds, caching, distroless.' },
      { title: 'docker-compose', description: 'App + Postgres + Redis orchestration.' },
      { title: 'Production Considerations', description: 'Healthchecks, logs, envs.' },
    ],
  },
  {
    title: 'Redis Fundamentals: Caching & Pub/Sub',
    description:
      'Speed up your API with Redis caching, key design, invalidation, and (optional) pub/sub patterns.',
    instructor: 'Dimas Anggara',
    topics: ['redis', 'caching', 'pubsub', 'performance'],
    price: 59,
    modules: [
      { title: 'Redis Basics', description: 'Data structures, TTL, persistence (AOF/RDB).' },
      { title: 'Caching Patterns', description: 'Cache-aside, write-through, stampede control.' },
      { title: 'Key Design & Invalidation', description: 'Namespaces, versions, invalidation flows.' },
      { title: 'Pub/Sub & Streams', description: 'Notifying clients, consumer groups.' },
    ],
  },
  {
    title: 'File Storage with Cloudflare R2 & S3',
    description:
      'Upload and serve media with object storage. Signed URLs, content types, and cleanup strategies.',
    instructor: 'Putra Wirawan',
    topics: ['object storage', 's3', 'r2', 'uploads'],
    price: 39,
    modules: [
      { title: 'Buckets & Objects', description: 'Structure, ACLs, lifecycle policies.' },
      { title: 'SDKs & APIs', description: 'S3-compatible APIs, clients, retries.' },
      { title: 'Uploading from Backend', description: 'Multipart forms, size limits, MIME.' },
      { title: 'Serving & Security', description: 'Public vs signed URLs, hotlinking.' },
    ],
  },
  {
    title: 'Testing Node & Nest with Jest',
    description:
      'Confident changes with unit & e2e tests using Jest and Supertest. Coverage and CI basics.',
    instructor: 'Aulia Hanafiah',
    topics: ['testing', 'jest', 'supertest', 'ci'],
    price: 49,
    modules: [
      { title: 'Unit Testing Services', description: 'Mocks, spies, fakes, DI benefits.' },
      { title: 'Controller Tests', description: 'HTTP layer tests with Supertest.' },
      { title: 'Database Strategies', description: 'Test DB vs mocking ORM.' },
      { title: 'Coverage & CI', description: 'Thresholds, flaky tests, pipelines.' },
    ],
  },
  {
    title: 'OWASP Top 10 (2021) for Backend',
    description:
      'Understand and mitigate the most critical web risks: injection, auth failures, misconfig and more.',
    instructor: 'Dinda Lestari',
    topics: ['owasp', 'security', 'xss', 'sql injection'],
    price: 69,
    modules: [
      { title: 'Broken Access Control', description: 'Common pitfalls and guardrails.' },
      { title: 'Cryptographic Failures', description: 'TLS, hashing, secrets handling.' },
      { title: 'Injection & XSS', description: 'Parameterized queries, escaping, CSP.' },
      { title: 'Security Misconfiguration', description: 'Headers, CORS, cloud defaults.' },
      { title: 'Logging & Monitoring', description: 'Detection, alerts, traceability.' },
    ],
  },
  {
    title: 'HTTP & Networking for Developers',
    description:
      'Go beyond fetch: HTTP semantics, caching, TLS, CDNs and performance from client to server.',
    instructor: 'Galang Pratama',
    topics: ['http', 'tcp/ip', 'tls', 'caching'],
    price: 59,
    modules: [
      { title: 'HTTP Core', description: 'Methods, status codes, headers, content negotiation.' },
      { title: 'Caching on the Web', description: 'Etag, Cache-Control, Vary, CDNs.' },
      { title: 'TLS & Certificates', description: 'PKI, handshake, HSTS, OCSP.' },
      { title: 'Performance Fundamentals', description: 'Latency, throughput, multiplexing.' },
    ],
  },
  {
    title: 'Design Patterns in TypeScript',
    description:
      'Apply SOLID and classic patterns to structure maintainable Node/Nest backends.',
    instructor: 'Harun Setiawan',
    topics: ['design patterns', 'solid', 'typescript', 'oop'],
    price: 79,
    modules: [
      { title: 'SOLID in Practice', description: 'Single Responsibility, Open/Closed, etc.' },
      { title: 'Factory & Strategy', description: 'Pluggable behaviors, testability.' },
      { title: 'Decorator & Adapter', description: 'Composition, compatibility, cross-cutting.' },
      { title: 'Repository & Unit of Work', description: 'Data abstraction, transaction scope.' },
    ],
  },
  {
    title: 'Linux & Shell for Developers',
    description:
      'Everyday Linux: processes, permissions, networking, tooling and shell scripting for productivity.',
    instructor: 'Intan Maheswari',
    topics: ['linux', 'bash', 'processes', 'networking'],
    price: 39,
    modules: [
      { title: 'Filesystem & Permissions', description: 'Users, groups, chmod, sudo.' },
      { title: 'Processes & Services', description: 'ps/top, systemd, logs.' },
      { title: 'Networking Basics', description: 'ip/ss, ports, firewalls.' },
      { title: 'Shell Scripting', description: 'Pipelines, variables, traps.' },
    ],
  },
  {
    title: 'Performance, Logging & Monitoring',
    description:
      'Profile bottlenecks, add structured logs, and monitor metrics to keep services healthy.',
    instructor: 'Joko Lesmana',
    topics: ['profiling', 'logging', 'metrics', 'monitoring'],
    price: 59,
    modules: [
      { title: 'Profiling & Benchmarks', description: 'CPU/heap, flamegraphs, baselines.' },
      { title: 'Structured Logging', description: 'Correlation IDs, levels, JSON logs.' },
      { title: 'Metrics & Dashboards', description: 'Counters, histograms, SLOs.' },
      { title: 'Alerts & On-call Basics', description: 'Thresholds, noise, runbooks.' },
    ],
  },
];

async function wipeAll() {
  await prisma.$transaction([
    prisma.certificate.deleteMany(),
    prisma.completion.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.module.deleteMany(),
    prisma.course.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function seedAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@grocademy.local',
      username: 'admin',
      firstName: 'Gro',
      lastName: 'Admin',
      password: hash,
      role: Role.ADMIN,
      balance: 0,
    },
  });
  return admin;
}

async function seedCourses(adminId: number) {
  for (const c of COURSES) {
    await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        instructor: c.instructor,
        topics: c.topics.map(t => t.toLowerCase()),
        price: c.price,
        thumbnailImage: null,
        creatorId: adminId,
        modules: {
          create: c.modules.map((m, idx) => ({
            title: m.title,
            description: m.description,
            order: idx + 1,
            pdfContent: null,
            videoContent: null,
          })),
        },
      },
    });
  }
}

async function main() {
  console.log('[seed] wiping…');
  await wipeAll();

  console.log('[seed] creating admin…');
  const admin = await seedAdmin();

  console.log('[seed] creating courses…');
  await seedCourses(admin.id);

  const totalCourses = await prisma.course.count();
  const totalModules = await prisma.module.count();
  console.log('[seed] done:', {
    admin: { id: admin.id, username: admin.username },
    courses: totalCourses,
    modules: totalModules,
  });
}

main()
  .catch((e) => {
    console.error('[seed] error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });