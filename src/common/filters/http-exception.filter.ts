import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();
    const timestamp = new Date().toISOString();
    const path = request.url;

    let message: string | object = exception.message;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      (exceptionResponse as any).message
    ) {
      message = (exceptionResponse as any).message;
    }

    if (status >= 500) {
      this.logger.error(
        `SERVER ERROR [${status}] - ${request.method} ${path}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `CLIENT ERROR [${status}] - ${request.method} ${path} - ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp,
      path,
      message,
    });
  }
}
