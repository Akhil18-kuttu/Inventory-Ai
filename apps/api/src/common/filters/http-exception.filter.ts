import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'An unexpected error occurred';

    const requestId = request.headers['x-request-id'] || 'N/A';

    let errorMessage = 'An unexpected error occurred';
    let errorDetails: unknown = undefined;

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as Record<string, any>;
      errorMessage = respObj.message || errorMessage;
      errorDetails = respObj.error || respObj.message || undefined;
    }

    const errorResponse = {
      success: false,
      error: {
        code: exception instanceof HttpException ? HttpStatus[status] : 'INTERNAL_SERVER_ERROR',
        message: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
        details: errorDetails,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    // Structured logging
    this.logger.error(
      `[Request-ID: ${requestId}] [${request.method}] ${request.url} - Status: ${status} - Error: ${
        exception instanceof Error ? exception.message : JSON.stringify(errorMessage)
      }`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }
}
