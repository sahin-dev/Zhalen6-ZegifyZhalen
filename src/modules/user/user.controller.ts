import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { CurrentUser, Public } from '../../common/decorators';
import { AuthService } from '../auth/auth.service';
import {
  ForgetPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from '../auth/dtos';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get('me')
  getProfile(@CurrentUser('sub') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Patch()
  updateProfileCompatibility(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, dto);
  }

  @Public()
  @Post('forget-password')
  forgetPassword(@Body() dto: ForgetPasswordDto) {
    return this.authService.forgetPassword(dto);
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() body: { email: string } & ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body);
  }

  @Delete('me')
  deleteAccount(@CurrentUser('sub') userId: string) {
    return this.userService.deleteAccount(userId);
  }
}

@Controller('auth')
export class AuthProfileController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getProfile(@CurrentUser('sub') userId: string) {
    return this.userService.getProfile(userId);
  }
}
