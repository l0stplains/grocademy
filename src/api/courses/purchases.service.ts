import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async buyCourse(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    // quick prechecks
    const already = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (already) throw new BadRequestException('You already own this course');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if ((user.balance ?? 0) < course.price) {
      throw new BadRequestException('Insufficient balance');
    }

    const txId = randomUUID();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: user.balance - course.price },
      }),
      this.prisma.enrollment.create({
        data: { userId, courseId },
      }),
      // Note: i think it would be better if i had transaction table for history. hope i get enough time
    ]);

    // fresh balance
    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    return {
      course_id: String(courseId),
      user_balance: updated?.balance ?? 0,
      transaction_id: txId,
    };
  }

  async myCourses(userId: number, q?: string, page = 1, limit = 15) {
    const take = Math.min(Math.max(+limit || 15, 1), 50);
    const current = Math.max(+page || 1, 1);
    const skip = (current - 1) * take;
    const qLower = q?.toLowerCase();

    const whereEnroll: Prisma.EnrollmentWhereInput = {
      userId,
      ...(q
        ? {
            course: {
              OR: [
                { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
                {
                  instructor: {
                    contains: q,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                { topics: { has: qLower! } },
              ],
            },
          }
        : {}),
    };

    const [total, enrollments] = await this.prisma.$transaction([
      this.prisma.enrollment.count({ where: whereEnroll }),
      this.prisma.enrollment.findMany({
        where: whereEnroll,
        skip,
        take,
        orderBy: { purchasedAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              instructor: true,
              topics: true,
              thumbnailImage: true,
              modules: { select: { id: true }, orderBy: { order: 'asc' } },
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
    ]);

    const courseIds = enrollments.map((e) => e.course.id);
    // count completions grouped by course via module relation
    const completions = await this.prisma.completion.findMany({
      where: { userId, module: { courseId: { in: courseIds } } },
      select: { module: { select: { courseId: true } } },
    });

    const completedByCourse = new Map<number, number>();
    for (const c of completions) {
      const cid = c.module.courseId;
      completedByCourse.set(cid, (completedByCourse.get(cid) ?? 0) + 1);
    }

    const items = enrollments.map((e) => {
      const totalModules = e.course.modules.length;
      const completed = completedByCourse.get(e.course.id) ?? 0;
      const percentage =
        totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0;

      return {
        id: String(e.course.id),
        title: e.course.title,
        instructor: e.course.instructor,
        topics: e.course.topics,
        thumbnail_image: e.course.thumbnailImage,
        progress_percentage: percentage,
        purchased_at: e.purchasedAt.toISOString(),
      };
    });

    return {
      items,
      pagination: {
        current_page: current,
        total_pages: Math.max(1, Math.ceil(total / take)),
        total_items: total,
      },
    };
  }
}
