import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateSettingDto } from './dto/update-settings.dto';
import { UpdateProfileSettingsDto } from './dto/update-profile-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings() {
    return this.prisma.setting.findMany();
  }

  async updateSetting(dto: UpdateSettingDto) {
    return this.prisma.setting.upsert({
      where: { key: dto.key },
      update: {
        value: dto.value,
        category: dto.category || 'GENERAL',
        isPublic: dto.isPublic ?? false,
      },
      create: {
        key: dto.key,
        value: dto.value,
        category: dto.category || 'GENERAL',
        isPublic: dto.isPublic ?? false,
      },
    });
  }

  async getUserProfileSettings(userId: string) {
    let settings = await this.prisma.userProfileSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userProfileSetting.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateProfileSettings(userId: string, dto: UpdateProfileSettingsDto) {
    return this.prisma.userProfileSetting.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }

  async getNotificationSettings(userId: string) {
    const settings = await this.getUserProfileSettings(userId);
    return {
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
    };
  }

  async updateNotificationSettings(userId: string, dto: UpdateNotificationSettingsDto) {
    return this.prisma.userProfileSetting.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }
}
