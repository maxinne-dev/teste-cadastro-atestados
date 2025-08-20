import { MongoExceptionFilter } from './mongo-exception.filter'
import { ArgumentsHost, HttpStatus } from '@nestjs/common'

function createHostMock() {
  const json = jest.fn()
  const status = jest.fn(() => ({ json })) as any
  const getResponse = jest.fn(() => ({ status }))
  const switchToHttp = jest.fn(() => ({ getResponse }))
  const host = {
    switchToHttp,
  } as unknown as ArgumentsHost
  return { host, status, json }
}

describe('MongoExceptionFilter', () => {
  it('maps duplicate key error to 409 with message', () => {
    const filter = new MongoExceptionFilter()
    const { host, status, json } = createHostMock()
    const err: any = { code: 11000, keyValue: { email: 'a@b.com' } }
    filter.catch(err, host)
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: expect.stringMatching(/Duplicate email/i),
      })
    )
  })

  it('maps CastError to 400', () => {
    const filter = new MongoExceptionFilter()
    const { host, status, json } = createHostMock()
    const err: any = { name: 'CastError' }
    filter.catch(err, host)
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST })
    )
  })
})

