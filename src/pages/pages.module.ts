import { PagesController } from './pages.controller';
import { Module } from '@nestjs/common';
import { AuthModule } from '../api/auth/auth.module';
import { CoursesModule } from '../api/courses/courses.module';
import { ModulesModule } from '../api/modules/modules.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [AuthModule, CoursesModule, ModulesModule, PrismaModule],
  controllers: [PagesController],
  providers: [],
})
export class PagesModule {}
