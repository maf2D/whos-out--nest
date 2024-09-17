import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CustomMailerService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcome(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Our Service!',
      template: './welcome.template.pug',
      context: { name },
    });
  }

  async sendForgotPassword(email: string, name: string, url: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your password reset token (valid for 10 min)',
      template: './forgot-password.template.pug',
      context: { name, url },
    });
  }
}
