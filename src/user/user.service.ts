import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PasswordResetDto, SignUpUserDto, UserDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { IUserMethods, User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { createHash } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User, {}, IUserMethods>,
    private readonly cloudinaryService: CloudinaryService,
    private jwt: JwtService,
    private readonly mailerService: MailerService,
  ) {
    console.log('USER SERVICE CALLED');
  }

  private async signToken(userId: string, email: string): Promise<string> {
    const payload = {
      id: userId,
      email,
    };

    try {
      const token = await this.jwt.signAsync(payload, {
        expiresIn: process.env.JWT_EXPIRY,
        secret: process.env.JWT_SECRET,
      });

      return token;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async sendMail(email: string, subject: string, message: string) {
    try {
      this.mailerService.sendMail({
        from: 'noreply@nestjs.com', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: message, // plaintext body
      });
    } catch (error) {
      throw new HttpException(
        'Could not send email.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async signup(
    dto: SignUpUserDto,
    file: Express.Multer.File,
  ): Promise<{ user: SignUpUserDto; token: string } | HttpException> {
    try {
      const { name, email, password } = dto;

      if (!name || !email || !password) {
        throw new Error('Name, email and password are required.');
      }

      if (!file) {
        throw new Error('Photo is required to signup.');
      }

      const uploadResult = await this.cloudinaryService.uploadPhoto(file);

      const user = await this.userModel.create({
        name,
        email,
        password,
        photo: {
          id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
        },
      });

      const token = await this.signToken(user._id.toString(), user.email);

      user.password = undefined;

      return {
        user,
        token,
      };
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  async login(
    dto: UserDto,
  ): Promise<{ user: SignUpUserDto; token: string } | HttpException> {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');

    if (!user) {
      throw new HttpException(
        'User does not exist or password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordCorrect = await user.isPasswordValid(dto.password);

    if (!isPasswordCorrect) {
      throw new HttpException(
        'User does not exist or password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = await this.signToken(user._id.toString(), user.email);

    user.password = undefined;

    return {
      user,
      token,
    };
  }

  async forgotPassword(myUrl: string, email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }

    const forgotToken = user.getForgotPasswordToken();

    await user.save({ validateBeforeSave: false });

    const message = `Follow the link below to reset your password \n\n ${
      myUrl + forgotToken
    }`;

    await this.sendMail(email, 'Nest T-Store - Password reset email', message);

    return {
      message: 'Email sent successfully',
    };
  }

  async passwordReset(forgotToken: string, dto: PasswordResetDto) {
    // check for forgot token if its there and previous password
    const encryToken = createHash('sha256').update(forgotToken).digest('hex');

    let user = await this.userModel
      .findOne({
        forgotPasswordToken: encryToken,
        forgotPasswordExpiry: { $gt: Date.now() },
      })
      .select('+password');

    if (!user) {
      throw new HttpException(
        'Token is invalid or expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !dto.password ||
      !dto.confirmPassword ||
      dto.password !== dto.confirmPassword
    ) {
      throw new HttpException(
        'Password and confirm password do not match',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isNewPasswordSameAsBefore = await user.isPasswordValid(dto.password);

    if (isNewPasswordSameAsBefore) {
      throw new HttpException(
        'New password cannot be same as old password',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.password = dto.password;
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;

    user = await user.save();

    const token = await this.signToken(user._id.toString(), user.email);

    user.password = undefined;

    return {
      user,
      token,
    };
  }

  async getLoggedInUserDetails() {}
}
