import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // enable cors
  app.enableCors({
    credentials: true
  });

  // set global prefix
  app.setGlobalPrefix('api/v1');

  // set security http headers
  app.use(helmet());

  // cookie parser
  app.use(cookieParser());

  await app.listen(configService.get('PORT') || 3001);
}

bootstrap();
