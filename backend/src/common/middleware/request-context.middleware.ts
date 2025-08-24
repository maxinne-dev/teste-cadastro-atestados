import { Injectable, NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'crypto'

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const headerId = req.headers['x-request-id'] as string | undefined
    const id = headerId || randomUUID()
    req.id = id
    res.setHeader('x-request-id', id)
    next()
  }
}

