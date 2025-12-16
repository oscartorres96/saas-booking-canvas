import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Hardcoded fallback matching the user's request for "yo del correo owner" which implies a specific email.
        // Ideally this comes from ConfigService.
        const adminEmails = process.env.ADMIN_EMAIL
            ? [process.env.ADMIN_EMAIL]
            : ['oscartorres0396@gmail.com', 'owner@bookpro.com'];

        if (user && adminEmails.includes(user.email)) {
            return true;
        }

        throw new ForbiddenException('Access denied: Restricted to System Administrator');
    }
}
