import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { SmtpProvider } from 'src/common/providers/smtp.provider';
import * as bcrypt from 'bcrypt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import {
  SignUpDto,
  SignInDto,
  ForgetPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  AuthResponseDto,
  UserResponseDto,
} from './dtos';

interface OtpData {
  otp: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore: Map<string, OtpData> = new Map(); // In-memory OTP store
  private readonly OTP_EXPIRY_MINUTES = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly smtpProvider: SmtpProvider,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Sign up a new user
   */
  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { email, phone, password, ...userData } = signUpDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          phone,
          hashed_password: hashedPassword,
          ...userData,
        },
      });

      // Generate tokens
      const { access_token, refresh_token } = this.generateTokens(user.id, user.email, user.role);

      return {
        access_token,
        refresh_token,
        user: this.mapUserToResponse(user),
      };
    } catch (error) {
      this.logger.error('Error during sign up:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Sign in a user
   */
  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const { email, password } = signInDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is blocked
    if (user.is_blocked) {
      throw new UnauthorizedException('User account is blocked');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const { access_token, refresh_token } = this.generateTokens(user.id, user.email, user.role);

    return {
      access_token,
      refresh_token,
      user: this.mapUserToResponse(user),
    };
  }

  /**
   * Send OTP to user email for password reset
   */
  async forgetPassword(forgetPasswordDto: ForgetPasswordDto): Promise<{ message: string }> {
    const { email } = forgetPasswordDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal whether email exists or not for security
      return { message: 'If an account exists with this email, an OTP has been sent' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    this.otpStore.set(email, {
      otp,
      email,
      createdAt: new Date(),
      expiresAt,
      verified: false,
    });

    // Send OTP via email
    const emailTemplate = this.generateForgetPasswordTemplate(user.full_name, otp);
    await this.smtpProvider.sendMail({
      to: email,
      subject: 'Password Reset OTP',
      html: emailTemplate,
    });

    this.logger.log(`OTP sent to ${email}`);

    return { message: 'If an account exists with this email, an OTP has been sent' };
  }

  /**
   * Verify OTP
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string; verified: boolean }> {
    const { email, otp } = verifyOtpDto;

    const otpData = this.otpStore.get(email);

    if (!otpData) {
      throw new BadRequestException('No OTP found for this email');
    }

    // Check if OTP has expired
    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP has expired');
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Mark as verified
    otpData.verified = true;
    this.otpStore.set(email, otpData);

    return { message: 'OTP verified successfully', verified: true };
  }

  /**
   * Reset password
   */
  async resetPassword(
    email: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { new_password, confirm_password } = resetPasswordDto;

    // Check if passwords match
    if (new_password !== confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if OTP is verified
    const otpData = this.otpStore.get(email);

    if (!otpData || !otpData.verified) {
      throw new UnauthorizedException('Please verify OTP first');
    }

    try {
      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update user password
      await this.prisma.user.update({
        where: { email },
        data: { hashed_password: hashedPassword },
      });

      // Remove OTP from store
      this.otpStore.delete(email);

      this.logger.log(`Password reset for ${email}`);

      return { message: 'Password reset successfully' };
    } catch (error) {
      this.logger.error('Error during password reset:', error);
      throw new BadRequestException('Failed to reset password');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(userId: string, email: string, role: string) {
    const payload: Record<string, any> = { sub: userId, email, role };

    const access_token = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.secret,
      expiresIn: this.jwtConfiguration.expiresIn,
    } as any);

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.refreshSecret,
      expiresIn: this.jwtConfiguration.refreshExpiresIn,
    } as any);

    return { access_token, refresh_token };
  }

  /**
   * Map user to response DTO
   */
  private mapUserToResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Generate forget password email template
   */
  private generateForgetPasswordTemplate(fullName: string, otp: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 40px 20px;
                text-align: center;
            }
            .content p {
                color: #333;
                font-size: 16px;
                line-height: 1.6;
                margin: 15px 0;
            }
            .greeting {
                color: #667eea;
                font-weight: 600;
                font-size: 18px;
                margin-bottom: 20px;
            }
            .otp-box {
                background-color: #f9f9f9;
                border: 2px solid #667eea;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
            }
            .otp-text {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
            }
            .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: #667eea;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }
            .expiry-warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                text-align: left;
                font-size: 14px;
                color: #856404;
            }
            .footer {
                background-color: #f9f9f9;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #666;
            }
            .security-note {
                background-color: #e8f5e9;
                border-left: 4px solid #4caf50;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
                text-align: left;
                font-size: 13px;
                color: #2e7d32;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            
            <div class="content">
                <p class="greeting">Hello ${fullName},</p>
                
                <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
                
                <p>Use the following One-Time Password (OTP) to reset your password:</p>
                
                <div class="otp-box">
                    <div class="otp-text">Your OTP Code:</div>
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="expiry-warning">
                    ⏰ <strong>Important:</strong> This OTP will expire in 10 minutes. Please use it soon.
                </div>
                
                <div class="security-note">
                    🔒 <strong>Security Note:</strong> Never share this OTP with anyone. Our team will never ask you for this code.
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    If you didn't request a password reset, please <a href="#" style="color: #667eea; text-decoration: none;">change your account security settings</a> immediately.
                </p>
            </div>
            
            <div class="footer">
                <p>© 2026 Zhalen6. All rights reserved.</p>
                <p>This is an automated email, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}