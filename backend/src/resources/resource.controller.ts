import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Type,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ResourceService } from './resource.service';
import { ResourceConfig } from './resources.config';

export function createResourceController(config: ResourceConfig): Type<unknown> {
  const readGuard = config.publicRead ? OptionalJwtAuthGuard : JwtAuthGuard;

  @Controller(config.path)
  class ResourceController {
    constructor(public readonly resources: ResourceService) {}

    @Get()
    @UseGuards(readGuard)
    findAll(@Query() query: Record<string, string>) {
      return this.resources.findAll(config, query);
    }

    @Get(Array.isArray(config.pk) ? ':idPerfil/:idZona' : ':id')
    @UseGuards(readGuard)
    findOne(@Param('id') id?: string, @Param('idPerfil') idPerfil?: string, @Param('idZona') idZona?: string) {
      return this.resources.findOne(config, keysFromParams(config, { id, idPerfil, idZona }));
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() body: Record<string, unknown>) {
      return this.resources.create(config, body);
    }

    @Patch(Array.isArray(config.pk) ? ':idPerfil/:idZona' : ':id')
    @UseGuards(JwtAuthGuard)
    update(
      @Body() body: Record<string, unknown>,
      @Param('id') id?: string,
      @Param('idPerfil') idPerfil?: string,
      @Param('idZona') idZona?: string,
    ) {
      return this.resources.update(
        config,
        keysFromParams(config, { id, idPerfil, idZona }),
        body,
      );
    }

    @Delete(Array.isArray(config.pk) ? ':idPerfil/:idZona' : ':id')
    @UseGuards(JwtAuthGuard)
    remove(
      @Param('id') id?: string,
      @Param('idPerfil') idPerfil?: string,
      @Param('idZona') idZona?: string,
    ) {
      return this.resources.remove(config, keysFromParams(config, { id, idPerfil, idZona }));
    }
  }

  Object.defineProperty(ResourceController, 'name', {
    value: `${toPascal(config.path)}Controller`,
  });

  return ResourceController;
}

function keysFromParams(
  config: ResourceConfig,
  params: { id?: string; idPerfil?: string; idZona?: string },
) {
  if (Array.isArray(config.pk)) {
    return {
      id_perfil: Number(params.idPerfil),
      id_zona: Number(params.idZona),
    };
  }
  return { [config.pk]: Number(params.id) };
}

function toPascal(value: string) {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
