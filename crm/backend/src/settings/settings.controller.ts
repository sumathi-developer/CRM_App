import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-settings.dto';
import { UpdateProfileSettingsDto } from './dto/update-profile-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get global system settings' })
  @ApiResponse({ status: 200, description: 'List of system settings' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Patch()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update or create a system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  async updateSetting(@Body() dto: UpdateSettingDto) {
    return this.settingsService.updateSetting(dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get logged in user profile preference settings (theme, locale, timezone)' })
  @ApiResponse({ status: 200, description: 'User profile settings' })
  async getProfileSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getUserProfileSettings(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile preference settings' })
  @ApiResponse({ status: 200, description: 'Profile settings updated' })
  async updateProfileSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileSettingsDto,
  ) {
    return this.settingsService.updateProfileSettings(userId, dto);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get user notification preference settings' })
  @ApiResponse({ status: 200, description: 'Notification settings' })
  async getNotificationSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getNotificationSettings(userId);
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Update user notification preference settings' })
  @ApiResponse({ status: 200, description: 'Notification settings updated' })
  async updateNotificationSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.settingsService.updateNotificationSettings(userId, dto);
  }
}
