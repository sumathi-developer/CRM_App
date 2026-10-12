import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { HashUtil } from '../common/utils/hash.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: true,
        organization: true,
      },
    });

    if (user && (await HashUtil.compare(pass, user.passwordHash))) {
      const { passwordHash, refreshToken, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // Sanitize and validate organizationId
    let organizationId: string | undefined = undefined;
    if (registerDto.organizationId && registerDto.organizationId.trim() !== '') {
      const trimmedOrgId = registerDto.organizationId.trim();
      const org = await this.prisma.organization.findUnique({
        where: { id: trimmedOrgId },
      });
      if (!org) {
        throw new BadRequestException(
          `Organization with ID '${registerDto.organizationId}' does not exist. Omit organizationId if registering without an organization.`,
        );
      }
      organizationId = org.id;
    }

    // Role assignment: validate if provided, otherwise default to SALES_REP
    let roleId: string | undefined = undefined;
    if (registerDto.roleId && registerDto.roleId.trim() !== '') {
      const trimmedRoleId = registerDto.roleId.trim();
      const role = await this.prisma.role.findUnique({
        where: { id: trimmedRoleId },
      });
      if (!role) {
        throw new BadRequestException(
          `Role with ID '${registerDto.roleId}' does not exist. Omit roleId to default to SALES_REP.`,
        );
      }
      roleId = role.id;
    } else {
      const defaultRole = await this.prisma.role.findFirst({
        where: { name: 'SALES_REP' },
      });
      if (defaultRole) {
        roleId = defaultRole.id;
      }
    }

    const passwordHash = await HashUtil.hash(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: registerDto.name,
        passwordHash,
        phone: registerDto.phone,
        organizationId,
        roleId,
        status: 'ACTIVE',
        profileSettings: {
          create: {
            theme: 'dark',
            emailNotifications: true,
            pushNotifications: true,
          },
        },
      },
      include: {
        role: true,
        organization: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role?.name);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshToken: __, ...userResponse } = user;
    return {
      user: userResponse,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role?.name);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  async logout(userId: string) {
    if (userId) {
      await this.prisma.user.updateMany({
        where: { id: userId },
        data: { refreshToken: null },
      });
    }
    return { message: 'Successfully logged out' };
  }

  async refreshTokens(userId: string | undefined, refreshToken: string) {
    let targetUserId = userId;

    if (!targetUserId) {
      try {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: this.configService.get<string>('jwt.refreshSecret') || 'crm-refresh-token-secret-key-2026',
        });
        targetUserId = payload.sub;
      } catch {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const isMatch = await HashUtil.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role?.name);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email.toLowerCase() },
    });

    if (!user) {
      // Do not reveal email existence for security
      return { message: 'If that email exists, a password reset token has been generated' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    return {
      message: 'Password reset token generated successfully',
      resetToken, // Returned in API for testing/development convenience
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: resetPasswordDto.token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await HashUtil.hash(resetPasswordDto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password has been successfully reset' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        organization: true,
        profileSettings: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, refreshToken, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await HashUtil.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const newHash = await HashUtil.hash(changePasswordDto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(userId: string, email: string, role?: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret') || 'crm-super-secret-key-change-in-production',
        expiresIn: (this.configService.get<string>('jwt.expiresIn') || '7d') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'crm-refresh-token-secret-key-2026',
        expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') || '30d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '7d',
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await HashUtil.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}
