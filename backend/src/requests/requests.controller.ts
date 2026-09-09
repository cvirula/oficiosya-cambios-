import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioRow } from '../common/usuario.util';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestsService } from './requests.service';

@ApiTags('Requests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Crear una nueva solicitud de servicio (HU-13)',
    description:
      'El cliente autenticado envía una solicitud. Se inserta en solicitud_servicio con estado inicial Enviada.',
  })
  create(@CurrentUser() user: UsuarioRow, @Body() dto: CreateRequestDto) {
    return this.requests.create(user, dto);
  }
}
