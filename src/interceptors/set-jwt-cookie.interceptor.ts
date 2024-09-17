import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tap } from 'rxjs/operators';

@Injectable()
export class SetJwtCookieInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      tap(({ token }) => {
        const cookieOptions = {
          httpOnly: true,
          secure: false,
          maxAge:
            parseInt(this.configService.get('JWT_COOKIE_EXPIRES_IN')) *
            24 *
            60 *
            60 *
            1000,
        };

        if (this.configService.get('NODE_ENV') === 'production') {
          cookieOptions.secure = true;
        }

        response.cookie('jwt', token, cookieOptions);
      }),
    );
  }
}
