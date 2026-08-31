import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: 'El refresh token es obligatorio.' })
  refreshToken: string;
}
