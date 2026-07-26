import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const requestId = request.headers['x-request-id'] || 'N/A';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`[Request-ID: ${requestId}] [${method}] ${url} - ${Date.now() - now}ms`);
      }),
    );
  }
}