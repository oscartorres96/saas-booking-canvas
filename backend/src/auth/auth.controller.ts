import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from './jwt.guard';
import { AuthService } from './auth.service';
import { ActivateAccountDto } from './dto/activate-account.dto';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RegisterDto extends LoginDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

class CheckEmailDto {
  @IsEmail()
  email!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('activate')
  activate(@Body() body: ActivateAccountDto) {
    return this.authService.activateAccount(body.token, body.newPassword);
  }

  @Post('check-email')
  async checkEmail(@Body() body: CheckEmailDto) {
    return this.authService.checkEmailExists(body.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
