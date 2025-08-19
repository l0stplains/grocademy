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
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/create-course.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

function imageFilter(_req: any, file: Express.Multer.File, cb: Function) {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
}

@ApiTags('Courses')
@Controller('api/courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiConsumes('multipart/form-data')
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
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    await this.courses.remove(id);
    return res.status(HttpStatus.NO_CONTENT).send();
  }
}
