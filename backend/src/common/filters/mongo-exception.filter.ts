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
      });
    }

    // Mongoose CastError -> 400 Bad Request
    if (exception && exception.name === 'CastError') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Invalid identifier',
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as any;
      // eslint-disable-next-line no-console
      console.error('[HttpException]', { status, response: res });
      return response.status(status).json(res);
    }

    // Fallback
    // eslint-disable-next-line no-console
    console.error('[UnhandledException]', {
      message: exception?.message,
      exception,
    });
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: exception?.message || 'Unexpected error',
    });
  }
}
