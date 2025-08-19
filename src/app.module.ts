import { PagesModule } from './pages/pages.module';
import { ApiModule } from './api/api.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule, PagesModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
