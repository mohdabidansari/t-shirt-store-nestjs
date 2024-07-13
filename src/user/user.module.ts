import { Module } from '@nestjs/common';
import { UserController } from './UserController';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({}),
  ],
  providers: [UserService, CloudinaryService],
  controllers: [UserController],
})
export class UserModule {}
