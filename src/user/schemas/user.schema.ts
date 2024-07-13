import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/constants';
import { randomBytes, createHash } from 'crypto';

export interface IUserMethods {
  isPasswordValid(password: string): Promise<string>;
  getForgotPasswordToken(): string;
}

const validateEmail = function (email: string) {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

@Schema({ _id: false })
class Photo {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  secure_url: string;
}

@Schema()
export class User {
  @Prop({
    required: [true, 'Please prvide a name'],
    maxlength: [40, 'Name should be at most 40 characters long'],
  })
  name: string;

  @Prop({
    required: [true, 'Please provide an email'],
    unique: true,
    validate: [validateEmail, 'Please fill a valid email address'],
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({
    type: String,
    required: [true, 'Please enter a password'],
    minLength: [8, 'Password should be at least 8 characters long'],
    select: false,
  })
  password: string;

  @Prop({ default: Role.USER })
  role: string;

  @Prop({ required: true })
  photo: Photo;

  @Prop()
  forgotPasswordToken: string;

  @Prop()
  forgotPasswordExpiry: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.isPasswordValid = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.getForgotPasswordToken = function () {
  // we will store a hashed-forgot-password-token in db but we will return just the forgot-password-token and when we get the token from the user then we will hash the token exactly as done below and then match it with the token stored in db

  const forgotPasswordToken = randomBytes(20).toString('hex');

  this.forgotPasswordToken = createHash('sha256')
    .update(forgotPasswordToken)
    .digest('hex');

  // time for which the token will be valid
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;

  return forgotPasswordToken;
};
