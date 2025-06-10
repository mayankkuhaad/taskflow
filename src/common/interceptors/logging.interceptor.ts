// src/common/interceptors/logging.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    const { method, url, body, query, params } = req;
    const user = req.user as { id?: string; email?: string };
    const userId = user?.id || 'anonymous';
    const userEmail = user?.email || 'unknown';

    const now = Date.now();

    // Avoid logging sensitive data
    const safeBody = { ...body };
    if (safeBody.password) safeBody.password = '***';
    if (safeBody.token) safeBody.token = '***';

    this.logger.log(
      `Incoming Request: ${method} ${url} | User: ${userId} (${userEmail}) | Params: ${JSON.stringify(
        params,
      )} | Query: ${JSON.stringify(query)} | Body: ${JSON.stringify(safeBody)}`
    );

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `Response: ${method} ${url} | Status: ${res.statusCode} | Time: ${responseTime}ms | User: ${userId}`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `Error Response: ${method} ${url} | ${res.statusCode} | ${responseTime}ms | User: ${userId} | Message: ${error.message}`,
          );
        },
      }),
    );
  }
}
