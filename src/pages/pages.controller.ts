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

@Controller('/')
export class PagesController {
  constructor(
    private readonly auth: AuthService,
    private readonly courses: CoursesService,
    private readonly modules: ModulesService,
    private readonly purchases: PurchasesService,
    private readonly prisma: PrismaService,
  ) {}

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
      res
        .status(HttpStatus.UNAUTHORIZED)
        .render('pages/login', {
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
  async register(
    @Body()
    body: {
      email: string;
      username: string;
      first_name: string;
      last_name: string;
      password: string;
      confirm_password: string;
    },
    @Res() res: Response,
  ) {
    try {
      await this.auth.register({
        email: body.email,
        username: body.username,
        firstName: body.first_name,
        lastName: body.last_name,
        password: body.password,
        confirm_password: body.confirm_password,
      } as any);
      res.redirect('/login?ok=1');
    } catch (e: any) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .render('pages/register', {
          error: e?.message ?? 'Registration failed',
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
    const { items, pagination } = await this.courses.list(
      q || undefined,
      Number(page),
      Number(limit),
      user.id,
    );
    res.render('pages/courses', {
      title: 'Browse Courses - Grocademy',
      user: {
        ...user,
        balance:
          (
            await this.prisma.user.findUnique({
              where: { id: user.id },
              select: { balance: true },
            })
          )?.balance ?? 0,
      },
      q,
      page: Number(page),
      limit: Number(limit),
      courses: items,
      pagination,
    });
    return { __raw: true, payload: null };
  }

  @UseGuards(PageAuthGuard)
  @Get('/courses/:id')
  async courseDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser()
    user: { id: number; role: 'ADMIN' | 'USER'; username: string },
    @Res() res: Response,
    @Query('purchased') purchased?: string,
  ) {
    const data = await this.courses.findById(id, user.id);
    const cert = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: id } },
    });
    res.render('pages/course_detail', {
      title: data.title + ' - Grocademy',
      user,
      course: data,
      certificate_url: cert?.url ?? null,
      flash: purchased ? 'Purchase successful!' : null,
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
    const { items, pagination } = await this.purchases.myCourses(
      user.id,
      q || undefined,
      Number(page),
      Number(limit),
    );
    res.render('pages/my_courses', {
      title: 'My Courses - Grocademy',
      user: {
        ...user,
        balance:
          (
            await this.prisma.user.findUnique({
              where: { id: user.id },
              select: { balance: true },
            })
          )?.balance ?? 0,
      },
      q,
      page: Number(page),
      limit: Number(limit),
      courses: items,
      pagination,
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
    res.render('pages/modules', {
      title: 'Modules - Grocademy',
      user,
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
