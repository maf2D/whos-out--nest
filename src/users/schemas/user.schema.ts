import { randomBytes } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { hashToken } from '../../helpers/hash-token.helper';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema()
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ select: false, required: true })
  password: string;

  @Prop({ required: true })
  position: string;

  @Prop({ default: false })
  onVacation: boolean;

  @Prop({ default: false })
  onHolidays: boolean;

  @Prop()
  awayTill: Date;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop()
  passwordChangedAt: Date;

  @Prop()
  passwordResetToken: string;

  @Prop()
  passwordResetExpires: Date;

  // schema methods
  correctPassword?(userPass: string, dbPass: string): boolean;
  createPasswordResetToken?(resetTokenExpiresIn: number): string;
  changedPasswordAfter?(jwtTimestamp: number): boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// indexes
UserSchema.index({ firstName: 1, lastName: 1 });
UserSchema.index({ position: 1 });
UserSchema.index({ onHolidays: 1 });
UserSchema.index({ onVacation: 1 });

// pre save hook to hash a user password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // hash a password
  this.password = await hash(this.password, 12);

  next();
});

// compare passwords method
UserSchema.methods.correctPassword = function (
  userPass: string,
  dbPass: string,
) {
  return compare(userPass, dbPass);
};

// create reset token method
UserSchema.methods.createPasswordResetToken = function (
  resetTokenExpiresIn: number,
) {
  const resetToken = randomBytes(32).toString('hex');

  // save a hashed token in db
  this.passwordResetToken = hashToken(resetToken);
  this.passwordResetExpires = Date.now() + resetTokenExpiresIn * 60 * 1000;

  return resetToken;
};

// check for reset password time
UserSchema.methods.changedPasswordAfter = function (jwtTimestamp: number) {
  if (!this.passwordChangedAt) return false;

  const changedTimestamp = parseInt(
    (this.passwordChangedAt.getTime() / 1000).toString(),
    10,
  );

  return changedTimestamp < jwtTimestamp;
};
