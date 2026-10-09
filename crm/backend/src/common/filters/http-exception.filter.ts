import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: any = exception.message;
    let errors: any = null;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as any;
      message = resObj.message || exception.message;
      errors = resObj.error || null;
    }

    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
