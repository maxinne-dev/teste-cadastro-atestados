import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service.js';

@Injectable()
export class RequestAuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req?.method || 'GET';
    const url: string = req?.originalUrl || req?.url || '';

    const hasCpf = !!(req?.params?.cpf || req?.body?.cpf || req?.query?.cpf);
    const hasCollaborator = !!(
      req?.params?.collaboratorId ||
      req?.body?.collaboratorId ||
      req?.query?.collaboratorId
    );
    const isCertMutation =
      /\/medical-certificates(\/|$)/.test(url) &&
      /POST|PATCH|DELETE/i.test(method);

    const shouldAudit = hasCpf || hasCollaborator || isCertMutation;

    const actorUserId: string | undefined = req?.user?.sub;
    const ip: string | undefined = req?.ip;
    const userAgent: string | undefined = req?.headers?.['user-agent'];

    const targetId =
      req?.params?.cpf ||
      req?.body?.cpf ||
      req?.params?.collaboratorId ||
      req?.body?.collaboratorId ||
      req?.params?.id ||
      req?.body?.id;

    return next.handle().pipe(
      tap(async () => {
        if (!shouldAudit) return;
        try {
          await this.audit.record({
            action: 'request',
            actorUserId,
            resource: `${method} ${url}`,
            targetId: targetId ? String(targetId) : undefined,
            ip,
            userAgent,
          });
        } catch {
          // swallow audit errors
        }
      }),
    );
  }
}
