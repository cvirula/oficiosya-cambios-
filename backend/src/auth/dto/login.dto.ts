import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  correo: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria.' })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
