import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioRow } from '../common/usuario.util';
import { CreateRequestDto } from './dto/create-request.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
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

  @Get('client')
  @ApiOperation({ summary: 'Historial de solicitudes del cliente (HU-18)' })
  listClient(@CurrentUser() user: UsuarioRow) {
    return this.requests.listClient(user);
  }

  @Get('worker')
  @ApiOperation({ summary: 'Peticiones recibidas por el trabajador (HU-17)' })
  listWorker(@CurrentUser() user: UsuarioRow) {
    return this.requests.listWorker(user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Gestionar estado de una petición como trabajador (HU-17)' })
  updateStatus(
    @CurrentUser() user: UsuarioRow,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.requests.updateStatus(user, id, dto);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Calificar una solicitud completada (HU-18)' })
  createReview(
    @CurrentUser() user: UsuarioRow,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.requests.createReview(user, id, dto);
  }
}
