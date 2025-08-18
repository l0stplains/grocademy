import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception-filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as hbs from 'hbs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  const ROOT = process.cwd();
  app.useStaticAssets(join(ROOT, 'public'), {
    prefix: '/static',
  });
  app.setBaseViewsDir(join(ROOT, 'views'));
  app.setViewEngine('hbs');
  hbs.registerPartials(join(ROOT, 'views', 'partials'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Grocademy')
    .setDescription('Grocademy REST API docs')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/docs', app, document);

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  logger.log(`Server running on http://localhost:${PORT}`);
  logger.log(`Swagger docs available at http://localhost:${PORT}/docs`);
}
bootstrap();
