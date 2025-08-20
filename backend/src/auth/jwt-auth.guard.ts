import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from './jwt.service.js'
import { ROLES_KEY } from './roles.decorator.js'
import { RedisService } from './redis.service.js'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const auth = String(request.headers?.authorization || '')
    const [type, token] = auth.split(' ')
    if (type?.toLowerCase() !== 'bearer' || !token) throw new UnauthorizedException('Missing token')

    let payload: any
    try {
      payload = await this.jwt.verifyAsync(token)
    } catch {
      throw new UnauthorizedException('Invalid token')
    }

    // Check session in Redis/in-memory
    const jti = payload?.jti
    if (!jti) throw new UnauthorizedException('Invalid token')
    const sessionKey = `session:${jti}`
    const exists = await this.redis.get(sessionKey)
    if (!exists) throw new UnauthorizedException('Session expired')

    request.user = payload

    // Optional roles check via decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (requiredRoles && requiredRoles.length) {
      const userRoles: string[] = Array.isArray(payload?.roles) ? payload.roles : []
      const ok = requiredRoles.some((r) => userRoles.includes(r))
      if (!ok) throw new ForbiddenException('Insufficient role')
    }
    return true
  }
}
