import { join } from 'path';
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { TransportType } from '@nestjs-modules/mailer/dist/interfaces/mailer-options.interface';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExceptionsFilter } from './filters/exceptions.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';

@Module({
  imports: [

    // app modules
    UsersModule,
    AuthModule,

    // config
    ConfigModule.forRoot({
      isGlobal: true,

      // use env files only when it's not heroku
      ...(process.env.APP_HOST !== 'heroku' && {
        envFilePath: `.env.${process.env.NODE_ENV}`
      })
    }),

    // jwt config
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    }),

    // mongodb config
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config

          // get mongo url
          .get('MONGO_DB_URL')

          // replace db_password with the real one
          .replace('<db_password>', config.get('MONGO_DB_PASSWORD')),
      }),
    }),

    // mailer config
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        let transport: TransportType;

        // dev config using mailtrap
        if (config.get('NODE_ENV') === 'development') {
          transport = {
            host: config.get('EMAIL_HOST'),
            port: config.get('EMAIL_PORT'),
            auth: {
              user: config.get('EMAIL_USERNAME'),
              pass: config.get('EMAIL_PASSWORD'),
            },
          };
        }

        // prod config using sendgrid
        if (config.get('NODE_ENV') === 'production') {
          transport = {
            service: 'SendGrid',
            auth: {
              user: config.get('SENDGRID_USERNAME'),
              pass: config.get('SENDGRID_PASSWORD'),
            },
          };
        }

        return {
          transport,
          defaults: {
            from: `"No Reply" <${config.get('APP_EMAIL_FROM')}>`,
          },
          template: {
            dir: join(__dirname, '../src/templates/emails'),
            adapter: new PugAdapter(),
          },
        };
      },
    }),

    // rate limit config
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: parseInt(config.get('THROTTLE_TTL')) * 10000,
          limit: parseInt(config.get('THROTTLE_LIMIT')),
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
