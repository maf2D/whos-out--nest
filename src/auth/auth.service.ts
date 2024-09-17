import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { CustomMailerService } from '../services/mailer.service';
import { hashToken } from '../helpers/hash-token.helper';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private jwtService: JwtService,
    private mailerService: CustomMailerService,
    private configService: ConfigService,
  ) {}
  async signUp(signUpDto: SignUpDto) {
    const user = await this.userModel.create(signUpDto);
    const token = await this.createToken(user._id.toString());

    // remove the password from the response
    user.password = undefined;

    // send welcome message
    // await this.mailerService.sendWelcome(user.email, user.name);

    return { user, token };
  }

  async signIn({ email, password }: SignInDto) {
    const user = await this.userModel.findOne({ email }).select('+password');

    if (!user || !(await user?.correctPassword(password, user.password))) {
      throw new BadRequestException('Invalid email or password');
    }

    const token = await this.createToken(user._id.toString());

    // remove the password from the response
    user.password = undefined;

    return { user, token };
  }

  async forgotPassword({ email }: ForgotPasswordDto, url: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException(
        `There is no user with such ${email} address.`,
      );
    }

    const resetTokenExpiresIn = parseInt(
      this.configService.get('APP_RESET_TOKEN_EXPIRES_IN'),
    );

    // create reset token
    const resetToken = user.createPasswordResetToken(resetTokenExpiresIn);
    await user.save({ validateBeforeSave: false });

    // send reset token to a user via email
    const resetUrl = `${url}/api/v1/reset-password/${resetToken}`;
    await this.mailerService.sendForgotPassword(
      user.email,
      `${user.firstName} ${user.lastName}`,
      resetUrl,
    );
  }

  async resetPassword({ password }: ResetPasswordDto, token: string) {
    const hashedToken = hashToken(token);
    const user = await this.userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
  }

  async createToken(id: string) {
    return this.jwtService.signAsync({ id });
  }
}
