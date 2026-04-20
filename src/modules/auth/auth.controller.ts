import { Controller, Post, Body, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators';
import {
  SignUpDto,
  SignInDto,
  ForgetPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  /**
   * Sign in user
   * POST /auth/sign-in
   */
  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto);
  }

  /**
   * Forget password - sends OTP to email
   * POST /auth/forget-password
   */
  @Public()
  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto);
  }

  /**
   * Verify OTP
   * POST /auth/verify-otp
   */
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  /**
   * Reset password after OTP verification
   * POST /auth/reset-password
   * Body: { email, new_password, confirm_password }
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { email: string } & ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body);
  }
}