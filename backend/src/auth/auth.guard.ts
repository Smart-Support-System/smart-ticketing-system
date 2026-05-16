import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

interface SessionRequest {
  session?: {
    user?: any;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: SessionRequest = context.switchToHttp().getRequest();

    return request.session?.user ? true : false;
  }
}
