import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import { AxiosError } from 'axios'

// Handle only Axios errors to avoid interfering with other exceptions (e.g., 404)
@Catch(AxiosError as any)
export class AxiosExceptionFilter implements ExceptionFilter {
  catch(exception: AxiosError, host: ArgumentsHost) {
    const maybeAxios = exception as unknown as Partial<AxiosError>

    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = (maybeAxios.response?.status as number) || HttpStatus.BAD_GATEWAY
    const message = exception.message || 'Upstream request failed'

    // eslint-disable-next-line no-console
    console.error('[AxiosException]', {
      status,
      message,
      url: (maybeAxios.config as any)?.url,
    })

    return response.status(status).json({
      statusCode: status,
      error: 'UpstreamError',
      message,
      url: (maybeAxios.config as any)?.url,
    })
  }
}
