import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CoursesModule,
    ModulesModule,
  ],
})
export class ApiModule {}
