import {
  Body,
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PasswordResetDto, SignUpUserDto, UserDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Request, Response } from 'express';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('signup')
  @UseInterceptors(FileInterceptor('photo'))
  signup(
    @Body() dto: SignUpUserDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    return this.userService.signup(dto, photo);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Res({ passthrough: true }) response: Response, @Body() dto: UserDto) {
    return this.userService.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgotPassword')
  forgotPassword(@Req() req: Request, @Body() dto: { email: string }) {
    const url = `${req.protocol}://${req.get('host')}/users/password/reset/`;

    return this.userService.forgotPassword(url, dto.email);
  }

  @Get('/password/reset/:token')
  passwordReset(
    @Param('token') forgotToken: string,
    @Body() dto: PasswordResetDto,
  ) {
    return this.userService.passwordReset(forgotToken, dto);
  }
}
