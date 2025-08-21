import { PagesModule } from './pages/pages.module';
import { ApiModule } from './api/api.module';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AppService } from './app.service';
import { StorageModule } from './common/storage/storage.module';
import { CertificatesModule } from './common/certificates/certificates.module';
import { JwtCookieMiddleware } from './common/middleware/jwt-cookie.middleware';

@Module({
  imports: [
    PrismaModule,
    PagesModule,
    ApiModule,
    StorageModule,
    CertificatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtCookieMiddleware).forRoutes('*');
  }
}
