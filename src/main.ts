import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

console.log(process.env);


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // set global prefix
  app.setGlobalPrefix('api/v1');

  // set security http headers
  app.use(helmet());

  // cookie parser
  app.use(cookieParser());

  await app.listen(configService.get('APP_PORT') || 3001);
}

bootstrap();
