import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const REQUEST_STATUSES = [
  'Enviada',
  'Aceptada',
  'En proceso',
  'Completada',
  'Rechazada',
  'Cancelada',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export class UpdateRequestStatusDto {
  @ApiProperty({ enum: REQUEST_STATUSES, example: 'Aceptada' })
  @IsIn(REQUEST_STATUSES)
  estado: RequestStatus;
}
