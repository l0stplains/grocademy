import { PagesModule } from './pages/pages.module';
import { ApiModule } from './api/api.module';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { CertificatesModule } from './common/certificates/certificates.module';
import { JwtCookieMiddleware } from './common/middleware/jwt-cookie.middleware';
import { RedisModule } from './common/redis/redis.module';
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    PrismaModule,
    PagesModule,
    ApiModule,
    StorageModule,
    CertificatesModule,
    RedisModule,
    CacheModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtCookieMiddleware).forRoutes('*');
  }
}
