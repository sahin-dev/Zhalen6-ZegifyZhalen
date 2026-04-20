import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Strategy for Passport
 * Validates JWT tokens in Authorization header
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret') || 'default-secret-key',
    });
  }

  validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}

/**
 * JWT Auth Guard
 * Use @UseGuards(JwtAuthGuard) to protect routes
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

// ============================================
// USAGE IN CONTROLLERS
// ============================================

// import { Controller, Get, UseGuards, Request } from '@nestjs/common';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// @Controller('profile')
// export class ProfileController {
//   @Get()
//   @UseGuards(JwtAuthGuard)
//   getProfile(@Request() req) {
//     // req.user will contain { userId, email }
//     return {
//       message: 'Profile retrieved successfully',
//       user: req.user,
//     };
//   }
// }

// ============================================
// SETUP IN AUTH MODULE
// ============================================

// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import { JwtStrategy } from './strategies/jwt.strategy';
// import { JwtAuthGuard } from './guards/jwt-auth.guard';

// @Module({
//   imports: [
//     PassportModule,
//     JwtModule.register({
//       secret: 'your-secret-key',
//       signOptions: { expiresIn: '15m' },
//     }),
//   ],
//   providers: [JwtStrategy, JwtAuthGuard],
//   exports: [JwtStrategy, JwtAuthGuard],
// })
// export class AuthModule {}
