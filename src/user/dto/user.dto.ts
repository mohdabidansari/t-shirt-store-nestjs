import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

type Photo = {
  id: string;
  secure_url: string;
};

export class UserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SignUpUserDto extends UserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  role?: string;

  @IsOptional()
  photo?: Photo;
}

export class PasswordResetDto {
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  confirmPassword: string;
}
