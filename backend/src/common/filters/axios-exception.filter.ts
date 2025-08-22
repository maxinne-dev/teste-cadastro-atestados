import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'

@Catch()
export class AxiosExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()

    if (exception?.isAxiosError) {
      const status = exception.response?.status || HttpStatus.BAD_GATEWAY
      const message = exception.message || 'Upstream request failed'
      return response.status(status).json({
        statusCode: status,
        error: 'UpstreamError',
        message,
        url: exception.config?.url,
      })
    }
    throw exception
  }
}

