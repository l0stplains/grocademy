import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // if controller already sends raw express response, skip wrapping
        if (data && data.__raw === true) return data.payload;

        // if data has message or data, wrap it
        if (data && (data.message || data.data)) {
          return {
            status: 'success',
            message: data.message ?? '',
            data: data.data ?? null,
          };
        }

        // Fallback: wrap raw data
        return { status: 'success', message: '', data };
      }),
    );
  }
}
