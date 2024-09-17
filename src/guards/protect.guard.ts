import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProtectGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const {
      headers: { authorization },
      cookies,
    } = request;
    let token: string;

    if (authorization && authorization.startsWith('Bearer')) {
      token = authorization.split(' ')[1];
    }

    if (!token && cookies.jwt) {
      token = cookies.jwt;
    }

    if (!token) {
      throw new UnauthorizedException(
        'You are not logged in! Please log in to get access.',
      );
    }

    const decoded = this.jwtService.decode(token);
    const currentUser = await this.usersService.findOne(decoded.id);

    if (!currentUser) {
      throw new UnauthorizedException(
        'The user belonging to this token does not exist.',
      );
    }

    const isChangedAfter = currentUser.changedPasswordAfter(decoded.iat);

    if (isChangedAfter) {
      throw new UnauthorizedException(
        'User recently changed password! Please log in again.',
      );
    }

    request.user = currentUser;

    return true;
  }
}
