import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { AxiosError } from 'axios';

// Handle only Axios errors to avoid interfering with other exceptions (e.g., 404)
@Catch(AxiosError as any)
export class AxiosExceptionFilter implements ExceptionFilter {
  catch(exception: AxiosError, host: ArgumentsHost) {
    const maybeAxios = exception as unknown as Partial<AxiosError> & {
      isAxiosError?: boolean;
    };
    if (!maybeAxios?.isAxiosError) {
      // Not an axios error: let other filters/handlers deal with it
      throw exception as any;
    }

    const ctx = host.switchToHttp();
    let request: any = null;
    try {
      request = (ctx as any).getRequest ? (ctx as any).getRequest() : null;
    } catch {
      request = null;
    }
    const response = ctx.getResponse();
    const status =
      (maybeAxios.response?.status as number) || HttpStatus.BAD_GATEWAY;
    const message = exception.message || 'Upstream request failed';
    const reqId =
      (request && (request.id || request.headers?.['x-request-id'])) || null;
    const upstreamCode =
      (maybeAxios.response?.data as any)?.code ||
      (maybeAxios as any)?.code ||
      undefined;

    // Structured error log
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: 'error',
        type: 'AxiosException',
        status,
        message,
        url: (maybeAxios.config as any)?.url,
        upstreamCode,
        requestId: reqId,
      }),
    );

    return response.status(status).json({
      statusCode: status,
      error: 'UpstreamError',
      message,
      url: (maybeAxios.config as any)?.url,
      code: upstreamCode,
      requestId: reqId,
    });
  }
}
