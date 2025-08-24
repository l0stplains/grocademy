import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../api/auth/auth.service';
import { CoursesService } from '../api/courses/courses.service';
import { PurchasesService } from '../api/courses/purchases.service';
import { ModulesService } from '../api/modules/modules.service';
import { PageAuthGuard } from '../common/guards/page-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from 'src/api/auth/dto/register.dto';

@Controller('/')
export class PagesController {
  constructor(
    private readonly auth: AuthService,
    private readonly courses: CoursesService,
    private readonly modules: ModulesService,
    private readonly purchases: PurchasesService,
    private readonly prisma: PrismaService,
  ) {}

  private async withBalance(user: {
    id: number;
    role: 'ADMIN' | 'USER';
    username: string;
  }) {
    const balance =
      (
        await this.prisma.user.findUnique({
          where: { id: user.id },
          select: { balance: true },
        })
      )?.balance ?? 0;
    return { ...user, balance };
  }

  private readonly PAGE_SIZE = 12;

  @Get('login')
  loginPage(@Res() res: Response, @Query('ok') ok?: string) {
    res.render('pages/login', { ok, title: 'Login - Grocademy' });
    return { __raw: true, payload: null };
  }

  @Post('login')
  async login(
    @Body() body: { identifier: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const result = await this.auth.login({
        identifier: body.identifier,
        password: body.password,
      });
      res.cookie('token', result.token, {
        httpOnly: true,
        maxAge: 3600 * 1000,
      });
      res.redirect('/courses');
    } catch (e: any) {
      res.status(HttpStatus.UNAUTHORIZED).render('pages/login', {
        error: e?.message ?? 'Login failed',
        title: 'Login - Grocademy',
      });
    }
    return { __raw: true, payload: null };
  }

  @Get('register')
  registerPage(@Res() res: Response) {
    res.render('pages/register', { title: 'Register - Grocademy' });
    return { __raw: true, payload: null };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    try {
      await this.auth.register(dto);
      res.redirect('/login?ok=1');
    } catch (e: any) {
      const errMsg =
        e?.response?.message?.join?.('\n') ||
        e?.message ||
        'Registration failed';
      res.status(HttpStatus.BAD_REQUEST).render('pages/register', {
        error: errMsg,
        title: 'Register - Grocademy',
      });
    }
    return { __raw: true, payload: null };
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('token');
    res.redirect('/login');
    return { __raw: true, payload: null };
  }

  @UseGuards(PageAuthGuard)
  @Get(['/', '/courses'])
  async browse(
    @CurrentUser()
    user: { id: number; role: 'ADMIN' | 'USER'; username: string },
    @Query('q') q = '',
    @Query('page') page = '1',
    @Query('limit') limit = '15',
    @Res() res: Response,
  ) {
    const viewUser = await this.withBalance(user);
    const { items, pagination } = await this.courses.list(
      q || undefined,
      Number(page),
      this.PAGE_SIZE,
      user.id,
    );
    res.render('pages/courses', {
      title: 'Browse Courses - Grocademy',
      description: 'Browse courses on Grocademy.',
      canonical: '/courses',
      user: viewUser,
      q,
      page: Number(page),
      courses: items,
      pagination,
    });

    return { __raw: true, payload: null };
  }

  @Get('/courses/:id')
  async courseDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser()
    user: { id: number; role: 'ADMIN' | 'USER'; username: string },
    @Res() res: Response,
    @Query('purchased') purchased?: string,
    @Query('error') error?: string,
  ) {
    const viewUser = await this.withBalance(user);
    const data = await this.courses.findById(id, user.id);
    const cert = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
    });
    res.render('pages/course_detail', {
      title: data.title + ' - Grocademy',
      description: data.description.slice(0, 160),
      ogImage: data.thumbnail_image,
      canonical: `/courses/${id}`,
      user: viewUser,
      course: data,
      certificate_url: cert?.url ?? null,
      flash: purchased ? 'Purchase successful!' : null,
      error,
    });
    return { __raw: true, payload: null };
  }

  @UseGuards(PageAuthGuard)
  @Post('/courses/:id/buy')
  async buyCourse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: 'ADMIN' | 'USER' },
    @Res() res: Response,
  ) {
    try {
      await this.purchases.buyCourse(user.id, id);
      res.redirect(`/courses/${id}?purchased=1`);
    } catch (e: any) {
      res.redirect(
        `/courses/${id}?error=${encodeURIComponent(e?.message ?? 'Purchase failed')}`,
      );
    }
    return { __raw: true, payload: null };
  }

  @UseGuards(PageAuthGuard)
  @Get('/my-courses')
  async myCourses(
    @CurrentUser()
    user: { id: number; role: 'ADMIN' | 'USER'; username: string },
    @Query('q') q = '',
    @Query('page') page = '1',
    @Query('limit') limit = '15',
    @Res() res: Response,
  ) {
    const viewUser = await this.withBalance(user);
    const { items, pagination } = await this.purchases.myCourses(
      user.id,
      q || undefined,
      Number(page),
      this.PAGE_SIZE,
    );

    // quick stats
    const total = items.length;
    const avgProgress = total
      ? Math.round(
          items.reduce((a, c) => a + (c.progress_percentage || 0), 0) / total,
        )
      : 0;

    res.render('pages/my_courses', {
      title: 'My Courses - Grocademy',
      description: 'Your purchased courses and learning progress on Grocademy.',
      canonical: '/my-courses',
      user: viewUser,
      q,
      page: Number(page),
      courses: items,
      pagination,
      stats: { total, avgProgress },
    });

    return { __raw: true, payload: null };
  }

  @UseGuards(PageAuthGuard)
  @Get('/courses/:id/modules')
  async modulesPage(
    @Param('id', ParseIntPipe) courseId: number,
    @CurrentUser()
    user: { id: number; role: 'ADMIN' | 'USER'; username: string },
    @Res() res: Response,
    @Query('m') m?: string, // selected module id
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const list = await this.modules.list(
      courseId,
      Number(page),
      Number(limit),
      user,
    );
    const modules = list.items;
    const selectedId = m
      ? Number(m)
      : modules[0]?.id
        ? Number(modules[0].id)
        : undefined;
    const selected = selectedId
      ? await this.modules.getById(selectedId, user)
      : null;
    const viewUser = await this.withBalance(user);
    res.render('pages/modules', {
      title: 'Modules - Grocademy',
      description:
        'Study course modules (PDFs/Videos), track progress, and get your certificate.',
      canonical: `/courses/${courseId}/modules`,
      user: viewUser,
      courseId,
      modules,
      selected,
      pagination: list.pagination,
    });

    return { __raw: true, payload: null };
  }

  @UseGuards(PageAuthGuard)
  @Post('/modules/:id/complete')
  async completeModule(
    @Param('id', ParseIntPipe) moduleId: number,
    @CurrentUser() user: { id: number; role: 'ADMIN' | 'USER' },
    @Query('courseId') courseId: string,
    @Res() res: Response,
  ) {
    await this.modules.complete(moduleId, user.id);
    res.redirect(`/courses/${courseId}/modules?m=${moduleId}`);
    return { __raw: true, payload: null };
  }
}
