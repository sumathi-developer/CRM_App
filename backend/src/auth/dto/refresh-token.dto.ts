import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({ example: 'jwt-refresh-token-string', description: 'Refresh token' })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({ example: 'jwt-refresh-token-string', description: 'Alternative alias for refreshToken' })
  @IsOptional()
  @IsString()
  token?: string;
}
