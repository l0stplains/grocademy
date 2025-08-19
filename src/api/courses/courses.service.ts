import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { LocalStorageService } from '../../common/storage/local-storage.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private storage: LocalStorageService,
  ) {}

  async create(dto: CreateCourseDto, thumbnail?: Express.Multer.File) {
    const thumbUrl = thumbnail
      ? (await this.storage.save(thumbnail, 'thumbnails')).url
      : null;
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
    return await this.findById(course.id, null); // null -> no is_purchased compute
  }

  async findById(id: number, currentUserId: number | null) {
    const c = await this.prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { modules: true } } },
    });
    if (!c) throw new NotFoundException('Course not found');
    let isPurchased: boolean | undefined = undefined;
    if (currentUserId) {
      const owned = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: currentUserId, courseId: id } },
      });
      isPurchased = !!owned;
    }
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

    const qLower = q?.toLowerCase();
    const where: Prisma.CourseWhereInput = q
      ? {
          OR: [
            { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { instructor: { contains: q, mode: Prisma.QueryMode.insensitive } },
            // topics stored lowercase on write:
            { topics: { has: qLower! } },
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

    const ids = rows.map((r) => r.id);
    const owned = await this.prisma.enrollment.findMany({
      where: { userId: currentUserId, courseId: { in: ids } },
      select: { courseId: true },
    });
    const ownedSet = new Set(owned.map((o) => o.courseId));

    const data = rows.map((c) => ({
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
      is_purchased: ownedSet.has(c.id),
    }));

    return {
      items: data,
      pagination: {
        current_page: current,
        total_pages: Math.max(1, Math.ceil(total / take)),
        total_items: total,
      },
    };
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
      if (thumbUrl) await this.storage.removeByUrl(thumbUrl);
      thumbUrl = (await this.storage.save(thumbnail, 'thumbnails')).url;
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
    return await this.findById(updated.id, null);
  }

  async remove(id: number) {
    const c = await this.prisma.course.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Course not found');
    if (c.thumbnailImage) await this.storage.removeByUrl(c.thumbnailImage);
    await this.prisma.course.delete({ where: { id } });
  }
}
