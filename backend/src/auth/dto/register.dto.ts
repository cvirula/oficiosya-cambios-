import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'El nombre completo es obligatorio.' })
  @MaxLength(150)
  nombre: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @MaxLength(150)
  correo: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\s()-]*$/, {
    message: 'El teléfono solo puede contener números y símbolos + - ( ).',
  })
  telefono?: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsIn(['cliente', 'trabajador'], {
    message: 'El modo debe ser cliente o trabajador.',
  })
  modo?: 'cliente' | 'trabajador';
}
