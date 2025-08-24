import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception-filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { join } from 'path';
import * as hbs from 'hbs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { setupSwagger } from './common/swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  const server = app.getHttpAdapter().getInstance();
  server.set('trust proxy', 1);

  const ROOT = process.cwd();
  app.useStaticAssets(join(ROOT, 'public'), {
    prefix: '/static',
  });
  app.setBaseViewsDir(join(ROOT, 'views'));
  app.setViewEngine('hbs');
  hbs.registerPartials(join(ROOT, 'views', 'partials'));
  (hbs as any).registerHelper('inc', (v: any) => Number(v) + 1);
  (hbs as any).registerHelper('dec', (v: any) => Number(v) - 1);
  (hbs as any).registerHelper(
    'eq',
    (a: any, b: any) => String(a) === String(b),
  );
  (hbs as any).registerHelper('gt', (a: any, b: any) => Number(a) > Number(b));
  (hbs as any).registerHelper('lt', (a: any, b: any) => Number(a) < Number(b));
  (hbs as any).registerHelper('formatDate', (iso: any) => {
    if (!iso) return '';
    const d = new Date(String(iso));
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  setupSwagger(app);

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, '0.0.0.0');

  logger.log(`Server running on http://localhost:${PORT}`);
  logger.log(`Swagger docs available at http://localhost:${PORT}/docs`);
}
bootstrap();
