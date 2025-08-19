import { PagesModule } from './pages/pages.module';
import { ApiModule } from './api/api.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AppService } from './app.service';
import { StorageModule } from './common/storage/storage.module';

@Module({
  imports: [PrismaModule, PagesModule, ApiModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
