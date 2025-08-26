import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    let request: any = null;
    try {
      request = (ctx as any).getRequest ? (ctx as any).getRequest() : null;
    } catch {
      request = null;
    }
    const response = ctx.getResponse();

    // Duplicate key error (MongoServerError 11000)
    if (exception && (exception.code === 11000 || exception?.errno === 11000)) {
      const key = Object.keys(
        exception.keyValue || exception.keyPattern || {},
      )[0];
      const value = key ? (exception.keyValue?.[key] ?? '') : undefined;
      const message = key
        ? `Duplicate ${key}: ${value}`
        : 'Duplicate key value violates unique constraint';
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message,
        key,
        value,
        requestId: request?.id || request?.headers?.['x-request-id'] || null,
      });
    }

    // Mongoose CastError -> 400 Bad Request
    if (exception && exception.name === 'CastError') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Invalid identifier',
        requestId: request?.id || request?.headers?.['x-request-id'] || null,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as any;
      const reqId = request?.id || request?.headers?.['x-request-id'] || null;
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          level: 'error',
          type: 'HttpException',
          status,
          response: res,
          requestId: request?.id || request?.headers?.['x-request-id'] || null,
        }),
      );
      const payload =
        typeof res === 'object'
          ? reqId
            ? { ...res, requestId: reqId }
            : res
          : res;
      return response.status(status).json(payload);
    }

    // Fallback
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: 'error',
        type: 'UnhandledException',
        message: exception?.message,
        requestId: request?.id || request?.headers?.['x-request-id'] || null,
      }),
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: exception?.message || 'Unexpected error',
      requestId: request?.id || request?.headers?.['x-request-id'] || null,
    });
  }
}
