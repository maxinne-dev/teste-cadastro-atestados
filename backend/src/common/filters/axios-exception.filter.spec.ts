import { AxiosExceptionFilter } from './axios-exception.filter'
import { ArgumentsHost, HttpStatus } from '@nestjs/common'

function createHostMock() {
  const json = jest.fn()
  const status = jest.fn(() => ({ json })) as any
  const getResponse = jest.fn(() => ({ status }))
  const switchToHttp = jest.fn(() => ({ getResponse }))
  const host = { switchToHttp } as unknown as ArgumentsHost
  return { host, status, json }
}

describe('AxiosExceptionFilter', () => {
  it('maps axios errors to upstream error with status from response', () => {
    const filter = new AxiosExceptionFilter()
    const { host, status, json } = createHostMock()
    const err: any = {
      isAxiosError: true,
      message: 'Request failed',
      response: { status: 502 },
      config: { url: 'https://api.example.com/x' },
    }
    filter.catch(err, host)
    expect(status).toHaveBeenCalledWith(502)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 502,
        error: 'UpstreamError',
        message: 'Request failed',
        url: 'https://api.example.com/x',
      })
    )
  })

  it('defaults status to 502 when missing and rethrows non-axios errors', () => {
    const filter = new AxiosExceptionFilter()
    const { host, status } = createHostMock()
    const err: any = { isAxiosError: true, message: 'net err' }
    filter.catch(err, host)
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY)

    const nonAxios: any = new Error('boom')
    expect(() => filter.catch(nonAxios, host)).toThrow('boom')
  })
})

