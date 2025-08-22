import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LocalStorageService } from '../../common/storage/local-storage.service';
import { CertificatesService } from '../../common/certificates/certificates.service';
import { CreateModuleDto, UpdateModuleDto } from './dto/create-module.dto';
import { Prisma } from '@prisma/client';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class ModulesService {
  constructor(
    private prisma: PrismaService,
    private storage: LocalStorageService,
    private certs: CertificatesService,
    private cache: CacheService,
  ) {}

  private versionNameForCourse(courseId: number) {
    return `modules:${courseId}`;
  }

  private async assertCourseReadable(
    courseId: number,
    user: { id: number; role: 'ADMIN' | 'USER' },
  ) {
    if (user.role === 'ADMIN') return;
    const owned = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (!owned)
      throw new ForbiddenException('You have not purchased this course');
  }

  private async nextOrder(courseId: number) {
    const max = await this.prisma.module.aggregate({
      where: { courseId },
      _max: { order: true },
    });
    return (max._max.order ?? 0) + 1;
  }

  async create(
    courseId: number,
    dto: CreateModuleDto,
    files: {
      pdf_content?: Express.Multer.File;
      video_content?: Express.Multer.File;
    },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const pdfUrl = files.pdf_content
      ? (await this.storage.save(files.pdf_content, 'pdfs')).url
      : null;
    const videoUrl = files.video_content
      ? (await this.storage.save(files.video_content, 'videos')).url
      : null;

    const order = dto.order ?? (await this.nextOrder(courseId));
    const m = await this.prisma.module.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        order,
        pdfContent: pdfUrl,
        videoContent: videoUrl,
      },
    });
    await this.cache.bump(this.versionNameForCourse(courseId));
    await this.cache.bump('courses'); // total_modules changed
    return this.toPublic(m, false);
  }

  toPublic(m: any, isCompleted: boolean) {
    return {
      id: String(m.id),
      course_id: String(m.courseId),
      title: m.title,
      description: m.description,
      order: m.order,
      pdf_content: m.pdfContent,
      video_content: m.videoContent,
      is_completed: isCompleted,
      created_at: m.createdAt?.toISOString?.() ?? undefined,
      updated_at: m.updatedAt?.toISOString?.() ?? undefined,
    };
  }

  async list(
    courseId: number,
    page = 1,
    limit = 15,
    user: { id: number; role: 'ADMIN' | 'USER' },
  ) {
    await this.assertCourseReadable(courseId, user);

    const take = Math.min(Math.max(+limit || 15, 1), 50);
    const current = Math.max(+page || 1, 1);
    const skip = (current - 1) * take;

    // cache user-agnostic module rows
    const base = await this.cache.wrap(
      'modules:list',
      this.versionNameForCourse(courseId),
      `course=${courseId}&page=${current}&limit=${take}`,
      60,
      async () => {
        const [total, rows] = await this.prisma.$transaction([
          this.prisma.module.count({ where: { courseId } }),
          this.prisma.module.findMany({
            where: { courseId },
            skip,
            take,
            orderBy: { order: 'asc' },
          }),
        ]);
        const items = rows.map((r) => this.toPublic(r, false));
        return {
          items,
          pagination: {
            current_page: current,
            total_pages: Math.max(1, Math.ceil(total / take)),
            total_items: total,
          },
        };
      },
    );

    // per-user completion overlay (not cached)
    let completedSet = new Set<number>();
    if (user.role !== 'ADMIN') {
      const completions = await this.prisma.completion.findMany({
        where: {
          userId: user.id,
          moduleId: { in: base.items.map((r) => Number(r.id)) },
        },
        select: { moduleId: true },
      });
      completedSet = new Set(completions.map((c) => c.moduleId));
    }
    const items = base.items.map((r) => ({
      ...r,
      is_completed: completedSet.has(Number(r.id)),
    }));
    return { items, pagination: base.pagination };
  }

  async getById(id: number, user: { id: number; role: 'ADMIN' | 'USER' }) {
    const m = await this.prisma.module.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Module not found');
    await this.assertCourseReadable(m.courseId, user);

    const isCompleted =
      user.role === 'ADMIN'
        ? false
        : !!(await this.prisma.completion.findUnique({
            where: { userId_moduleId: { userId: user.id, moduleId: m.id } },
          }));

    return this.toPublic(m, isCompleted);
  }

  async update(
    id: number,
    dto: UpdateModuleDto,
    files: {
      pdf_content?: Express.Multer.File;
      video_content?: Express.Multer.File;
    },
  ) {
    const m = await this.prisma.module.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Module not found');

    let pdf = m.pdfContent;
    let vid = m.videoContent;

    if (files.pdf_content) {
      if (pdf) await this.storage.removeByUrl(pdf);
      pdf = (await this.storage.save(files.pdf_content, 'pdfs')).url;
    }
    if (files.video_content) {
      if (vid) await this.storage.removeByUrl(vid);
      vid = (await this.storage.save(files.video_content, 'videos')).url;
    }

    const updated = await this.prisma.module.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        order: dto.order ?? undefined,
        pdfContent: pdf,
        videoContent: vid,
      },
    });
    await this.cache.bump(this.versionNameForCourse(updated.courseId));
    await this.cache.bump('courses');
    return this.toPublic(updated, false);
  }

  async remove(id: number) {
    const m = await this.prisma.module.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Module not found');
    if (m.pdfContent) await this.storage.removeByUrl(m.pdfContent);
    if (m.videoContent) await this.storage.removeByUrl(m.videoContent);
    await this.prisma.module.delete({ where: { id } });
    await this.cache.bump(this.versionNameForCourse(m.courseId));
    await this.cache.bump('courses');
  }

  async reorder(courseId: number, pairs: Array<{ id: number; order: number }>) {
    const allModules = await this.prisma.module.findMany({
      where: { courseId },
      select: { id: true },
    });

    if (allModules.length === 0) {
      throw new NotFoundException('No modules found for this course');
    }

    const expectedCount = allModules.length;
    const providedIds = pairs.map((p) => p.id);

    // ensure client provided ALL module IDs (no missing n no extras)
    const missing = allModules.filter((m) => !providedIds.includes(m.id));
    if (missing.length > 0) {
      throw new ForbiddenException(
        'Request must include all modules of the course',
      );
    }
    if (pairs.length !== expectedCount) {
      throw new ForbiddenException(
        'Request includes invalid or duplicate module IDs',
      );
    }

    // validate orders form a clean sequence [1..N]
    const providedOrders = pairs.map((p) => p.order).sort((a, b) => a - b);
    for (let i = 0; i < expectedCount; i++) {
      if (providedOrders[i] !== i + 1) {
        throw new ForbiddenException(
          `Orders must form a sequence 1..${expectedCount}`,
        );
      }
    }

    // two step update to avoid unique collisions (kinda hacky tho, sorry i cape)
    await this.prisma.$transaction(async (tx) => {
      // shift to temporary orders
      for (const p of pairs) {
        await tx.module.update({
          where: { id: p.id },
          data: { order: p.order + expectedCount }, // bump out of range
        });
      }

      // assign final orders
      for (const p of pairs) {
        await tx.module.update({
          where: { id: p.id },
          data: { order: p.order },
        });
      }
    });
    const sorted = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });
    await this.cache.bump(this.versionNameForCourse(courseId));

    return sorted.map((s) => ({ id: String(s.id), order: s.order }));
  }

  private async assertPurchased(courseId: number, userId: number) {
    const owned = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!owned)
      throw new ForbiddenException('You have not purchased this course');
  }

  async complete(moduleId: number, userId: number) {
    const mod = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });
    if (!mod) throw new NotFoundException('Module not found');

    await this.assertPurchased(mod.courseId, userId);

    // create completion if not exists
    await this.prisma.completion.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: { userId, moduleId },
      update: {},
    });

    const [totalModules, completedModules] = await Promise.all([
      this.prisma.module.count({ where: { courseId: mod.courseId } }),
      this.prisma.completion.count({
        where: { userId, module: { courseId: mod.courseId } },
      }),
    ]);

    const percentage =
      totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

    let certificateUrl: string | null = null;
    if (totalModules > 0 && completedModules === totalModules) {
      certificateUrl = await this.prisma.$transaction(
        async (tx) => {
          // recheck inside the txn
          const existing = await tx.certificate.findUnique({
            where: { userId_courseId: { userId, courseId: mod.courseId } },
            select: { url: true },
          });
          if (existing) return existing.url;

          // fetch details
          const [user, course] = await Promise.all([
            tx.user.findUnique({
              where: { id: userId },
              select: { username: true },
            }),
            tx.course.findUnique({
              where: { id: mod.courseId },
              select: { title: true, instructor: true },
            }),
          ]);
          if (!user || !course) {
            throw new BadRequestException('Unable to generate certificate');
          }

          const { url } = await this.certs.generatePdf({
            username: user.username,
            courseTitle: course.title,
            instructor: course.instructor,
            issuedAt: new Date(),
          });

          const created = await tx.certificate.create({
            data: { userId, courseId: mod.courseId, url },
            select: { url: true },
          });
          return created.url;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    }

    return {
      module_id: String(mod.id),
      is_completed: true,
      course_progress: {
        total_modules: totalModules,
        completed_modules: completedModules,
        percentage,
      },
      certificate_url: certificateUrl,
    };
  }
}
