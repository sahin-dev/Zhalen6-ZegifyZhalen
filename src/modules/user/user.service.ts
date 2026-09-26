import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { business_profile: true, seller_documents: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email || dto.phone) {
      const duplicate = await this.prisma.user.findFirst({
        where: {
          id: { not: userId },
          OR: [
            ...(dto.email ? [{ email: dto.email }] : []),
            ...(dto.phone ? [{ phone: dto.phone }] : []),
          ],
        },
      });
      if (duplicate)
        throw new ConflictException('Email or phone is already in use');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return this.sanitize(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      !(await bcrypt.compare(dto.current_password, user.hashed_password))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashed_password: await bcrypt.hash(dto.new_password, 12) },
    });
    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId: string) {
    const suffix = `${Date.now()}-${userId}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        is_blocked: true,
        deletedAt: new Date(),
        email: `deleted-${suffix}@invalid.local`,
        phone: `deleted-${suffix}`,
      },
    });
    return { message: 'Account deleted successfully' };
  }

  private sanitize(user: { hashed_password: string; [key: string]: unknown }) {
    const safeUser: { hashed_password?: string; [key: string]: unknown } = {
      ...user,
    };
    delete safeUser.hashed_password;
    return safeUser;
  }
}
