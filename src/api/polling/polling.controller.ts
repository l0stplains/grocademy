import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PollingService } from './polling.service';

@ApiTags('Polling')
@Controller('api/poll')
export class PollingController {
  constructor(private readonly svc: PollingService) {}

  // quick peek version (no wait)
  @Get('version/courses')
  async coursesVersion() {
    const version = await this.svc.currentCoursesVersion();
    return { message: '', data: { version } };
  }

  @Get('version/course/:id/modules')
  async modulesVersion(@Param('id', ParseIntPipe) id: number) {
    const version = await this.svc.currentModulesVersion(id);
    return { message: '', data: { version } };
  }

  // long poll (up to 25s)
  @Get('courses')
  async pollCourses(@Query('since') since = '0') {
    const v = await this.svc.waitCoursesSince(Number(since) || 0, 25000);
    return {
      message: '',
      data: { version: v, changed: v > Number(since || 0) },
    };
  }

  @Get('course/:id/modules')
  async pollModules(
    @Param('id', ParseIntPipe) id: number,
    @Query('since') since = '0',
  ) {
    const v = await this.svc.waitModulesSince(id, Number(since) || 0, 25000);
    return {
      message: '',
      data: { version: v, changed: v > Number(since || 0) },
    };
  }
}
