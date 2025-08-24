import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import {
  ApiOkWrapped,
  ApiOkPaginated,
} from '../../common/swagger/response-wrappers';
import {
  CourseItemResDto,
  CourseDetailResDto,
  BuyCourseResDto,
  MyCourseItemResDto,
} from './dto/course.responses';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CoursesService } from './courses.service';
import { PurchasesService } from './purchases.service'; // <-- add
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

function imageFilter(_req: any, file: Express.Multer.File, cb: Function) {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
}

@ApiTags('Courses')
@ApiCookieAuth('token')
@ApiBearerAuth('bearer')
@ApiExtraModels(
  CourseItemResDto,
  CourseDetailResDto,
  BuyCourseResDto,
  MyCourseItemResDto,
)
@Controller('api/courses')
export class CoursesController {
  constructor(
    private readonly courses: CoursesService,
    private readonly purchases: PurchasesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse(ApiOkWrapped(CourseDetailResDto))
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'thumbnail_image', maxCount: 1 }], {
      fileFilter: imageFilter,
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() dto: CreateCourseDto,
    @UploadedFiles() files: { thumbnail_image?: Express.Multer.File[] },
  ) {
    const thumb = files?.thumbnail_image?.[0];
    const course = await this.courses.create(dto, thumb);
    return { message: 'created', data: course };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    schema: { default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    schema: { default: 15, maximum: 50 },
  })
  @ApiResponse(ApiOkPaginated(CourseItemResDto))
  async list(
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '15',
    @Param() _p?: any,
    req?: any,
  ) {
    const currentUserId = req?.user?.id as number; // JwtStrategy attaches user
    const { items, pagination } = await this.courses.list(
      q,
      Number(page),
      Number(limit),
      currentUserId,
    );
    return {
      __raw: true,
      payload: { status: 'success', message: '', data: items, pagination },
    };
  }

  @Get('my-courses')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    schema: { default: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    schema: { default: 15, maximum: 50 },
  })
  @ApiResponse(ApiOkPaginated(MyCourseItemResDto))
  async mine(
    @CurrentUser() user: { id: number; role: 'ADMIN' | 'USER' },
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '15',
  ) {
    const { items, pagination } = await this.purchases.myCourses(
      user.id,
      q,
      Number(page),
      Number(limit),
    );
    return {
      __raw: true,
      payload: { status: 'success', message: '', data: items, pagination },
    };
  }

  @Post(':id/buy')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse(ApiOkWrapped(BuyCourseResDto))
  async buy(
    @Param('id', ParseIntPipe) courseId: number,
    @CurrentUser() user: { id: number; role: 'ADMIN' | 'USER' },
  ) {
    const data = await this.purchases.buyCourse(user.id, courseId);
    return { message: 'purchased', data };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse(ApiOkWrapped(CourseDetailResDto))
  async get(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: 'ADMIN' | 'USER' },
  ) {
    const data = await this.courses.findById(id, user?.id ?? null);
    return { message: '', data };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse(ApiOkWrapped(CourseDetailResDto))
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'thumbnail_image', maxCount: 1 }], {
      fileFilter: imageFilter,
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
    @UploadedFiles() files: { thumbnail_image?: Express.Multer.File[] },
  ) {
    const thumb = files?.thumbnail_image?.[0];
    const data = await this.courses.update(id, dto, thumb);
    return { message: 'updated', data };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 204, description: 'No Content' })
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    await this.courses.remove(id);
    return res.status(HttpStatus.NO_CONTENT).send();
  }
}
