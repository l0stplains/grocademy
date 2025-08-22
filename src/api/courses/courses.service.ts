import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { CacheService } from '../../common/cache/cache.service';
import {
  STORAGE_TOKEN,
  IStorageService,
} from '../../common/storage/storage.types';
import * as mime from 'mime-types';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_TOKEN) private storage: IStorageService,
    private cache: CacheService,
  ) {}

  async create(dto: CreateCourseDto, thumbnail?: Express.Multer.File) {
    let thumbUrl: string | null = null;
    if (thumbnail) {
      const ext = mime.extension(thumbnail.mimetype) || 'bin';
      const key = `thumbnails/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await this.storage.upload({
        buffer: thumbnail.buffer,
        key,
        contentType: thumbnail.mimetype,
      });
      thumbUrl = url;
    }
    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        instructor: dto.instructor,
        topics: dto.topics,
        price: dto.price,
        thumbnailImage: thumbUrl,
      },
    });
    await this.cache.bump('courses'); // invalidate lists everywhere
    await this.cache.bump(`course:${course.id}`); // invalidate detail
    return this.findById(course.id, null);
  }

  async findById(id: number, currentUserId: number | null) {
    const base = await this.cache.wrap(
      'course:detail',
      `course:${id}`,
      `id=${id}`,
      60,
      async () => {
        const c = await this.prisma.course.findUnique({
          where: { id },
          include: { _count: { select: { modules: true } } },
        });
        if (!c) throw new NotFoundException('Course not found');
        return {
          id: String(c.id),
          title: c.title,
          description: c.description,
          instructor: c.instructor,
          topics: c.topics,
          price: c.price,
          thumbnail_image: c.thumbnailImage,
          total_modules: c._count.modules,
          created_at: c.createdAt.toISOString(),
          updated_at: c.updatedAt.toISOString(),
        };
      },
    );

    let isPurchased: boolean | undefined = undefined;
    if (currentUserId) {
      const owned = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: currentUserId, courseId: id } },
      });
      isPurchased = !!owned;
    }
    return {
      ...base,
      ...(isPurchased !== undefined ? { is_purchased: isPurchased } : {}),
    };
  }

  async list(
    q: string | undefined,
    page = 1,
    limit = 15,
    currentUserId: number,
  ) {
    const take = Math.min(Math.max(+limit || 15, 1), 50);
    const current = Math.max(+page || 1, 1);
    const skip = (current - 1) * take;
    const qLower = q?.toLowerCase() || '';

    // cache the base (user agnostic) rows + total
    const base = await this.cache.wrap(
      'courses:list',
      'courses',
      `q=${qLower}&page=${current}&limit=${take}`,
      60,
      async () => {
        const where: Prisma.CourseWhereInput = q
          ? {
              OR: [
                { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
                {
                  instructor: {
                    contains: q,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                { topics: { has: qLower } },
              ],
            }
          : {};
        const [total, rows] = await this.prisma.$transaction([
          this.prisma.course.count({ where }),
          this.prisma.course.findMany({
            where,
            skip,
            take,
            orderBy: { id: 'asc' },
            include: { _count: { select: { modules: true } } },
          }),
        ]);
        const items = rows.map((c) => ({
          id: String(c.id),
          title: c.title,
          instructor: c.instructor,
          description: c.description,
          topics: c.topics,
          price: c.price,
          thumbnail_image: c.thumbnailImage,
          total_modules: c._count.modules,
          created_at: c.createdAt.toISOString(),
          updated_at: c.updatedAt.toISOString(),
        }));
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

    // add peruser purchase flags (not cached)
    const ids = base.items.map((i) => Number(i.id));
    const owned = await this.prisma.enrollment.findMany({
      where: { userId: currentUserId, courseId: { in: ids } },
      select: { courseId: true },
    });
    const set = new Set(owned.map((o) => o.courseId));
    const items = base.items.map((i) => ({
      ...i,
      is_purchased: set.has(Number(i.id)),
    }));
    return { items, pagination: base.pagination };
  }

  async update(
    id: number,
    dto: UpdateCourseDto,
    thumbnail?: Express.Multer.File,
  ) {
    const c = await this.prisma.course.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Course not found');

    let thumbUrl = c.thumbnailImage;
    if (thumbnail) {
      const ext = mime.extension(thumbnail.mimetype) || 'bin';
      const key = `thumbnails/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await this.storage.upload({
        buffer: thumbnail.buffer,
        key,
        contentType: thumbnail.mimetype,
      });
      if (thumbUrl) await this.storage.removeByUrl(thumbUrl);
      thumbUrl = url;
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        instructor: dto.instructor ?? undefined,
        topics: dto.topics ?? undefined,
        price: dto.price ?? undefined,
        thumbnailImage: thumbUrl,
      },
    });
    await this.cache.bump('courses');
    await this.cache.bump(`course:${id}`);
    return this.findById(updated.id, null);
  }

  async remove(id: number) {
    const c = await this.prisma.course.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Course not found');
    if (c.thumbnailImage) await this.storage.removeByUrl(c.thumbnailImage);
    await this.prisma.course.delete({ where: { id } });
    await this.cache.bump('courses');
    await this.cache.bump(`course:${id}`);
  }
}
