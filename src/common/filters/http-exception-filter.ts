import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      message = (res && res.message) || exception.message || message;
    }

    if (process.env.NODE_ENV !== 'production') {
      // kinda spammy
      this.logger.error(
        `HTTP Status: ${status} Error Message: ${message}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    if (!response.headersSent) {
      response.status(status).json({
        status: 'error',
        message,
        data: null,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
