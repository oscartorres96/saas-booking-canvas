import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any) {
        // Return the user if found, otherwise null (don't throw 401)
        if (err || !user) {
            return null;
        }
        return user;
    }
}
