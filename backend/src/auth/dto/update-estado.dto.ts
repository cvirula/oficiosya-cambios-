import { IsIn } from 'class-validator';

export class UpdateEstadoDto {
  @IsIn(['ACTIVO', 'SUSPENDIDO', 'ELIMINADO'], {
    message: 'El estado debe ser ACTIVO, SUSPENDIDO o ELIMINADO.',
  })
  estado: 'ACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
}
