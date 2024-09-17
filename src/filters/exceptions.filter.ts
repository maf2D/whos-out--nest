import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Error as MongooseError } from 'mongoose';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let message = 'An unexpected error occurred';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    // base exception
    if (exception instanceof HttpException) {
      message = exception.message;
      status = exception.getStatus();
    }

    // mongo exception
    if (exception instanceof MongoError || exception instanceof MongooseError) {
      message = exception.message;
      status = HttpStatus.BAD_REQUEST;
    }

    response.status(status).json({
      statusCode: status,
      message: message,

      // additional dev fields
      ...(this.configService.get('NODE_ENV') === 'development' && {
        '-': '------',
        timestamp: new Date().toISOString(),
        path: request.url,
        error: exception,
        stack: (exception as Error).stack,
      }),
    });
  }
}
