import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsuarioRow } from '../common/usuario.util';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { RequestStatus, UpdateRequestStatusDto } from './dto/update-request-status.dto';

export const ESTADO_SOLICITUD_INICIAL = 'Enviada';

type SolicitudRow = {
  id_solicitud: number;
  id_cliente: number;
  id_trabajador: number;
  id_servicio: number;
  descripcion: string;
  ubicacion_aprox: string | null;
  fecha_deseada: string | null;
  estado: string;
  urgente: boolean;
};

type PerfilRow = {
  id_perfil: number;
  id_usuario: number;
  oficio_principal: string;
  disponibilidad: string | null;
};

type ServicioRow = {
  id_servicio: number;
  id_perfil: number;
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

type ReviewRow = {
  id_resena: number;
  id_solicitud: number;
  id_cliente: number;
  id_trabajador: number;
  calificacion: number;
  comentario: string | null;
  respuesta: string | null;
  fecha: string;
};

const WORKER_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  Enviada: ['Aceptada', 'Rechazada'],
  Aceptada: ['En proceso', 'Completada'],
  'En proceso': ['Completada'],
  Completada: [],
  Rechazada: [],
  Cancelada: [],
};

@Injectable()
export class RequestsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(cliente: UsuarioRow, dto: CreateRequestDto) {
    const perfil = await this.findPerfil(dto.id_trabajador);
    if (!perfil) {
      throw new NotFoundException('El trabajador indicado no existe.');
    }
    if (perfil.id_usuario === cliente.id_usuario) {
      throw new ForbiddenException('No puedes enviarte una solicitud a ti mismo.');
    }

    const dueno = await this.findUsuario(perfil.id_usuario);
    if (!dueno || !dueno.modo_activo || dueno.estado !== 'ACTIVO') {
      throw new BadRequestException('Ese trabajador no está disponible para nuevas solicitudes.');
    }

    const servicio = await this.findServicio(dto.id_servicio);
    if (!servicio || !servicio.activo) {
      throw new NotFoundException('El servicio indicado no existe o no está activo.');
    }
    if (servicio.id_perfil !== perfil.id_perfil) {
      throw new BadRequestException('Ese servicio no pertenece al trabajador seleccionado.');
    }

    const payload = {
      id_cliente: cliente.id_usuario,
      id_trabajador: perfil.id_perfil,
      id_servicio: servicio.id_servicio,
      descripcion: dto.descripcion.trim(),
      ubicacion_aprox: dto.ubicacion_aprox?.trim() || null,
      fecha_deseada: dto.fecha_deseada || null,
      estado: ESTADO_SOLICITUD_INICIAL,
      urgente: Boolean(dto.urgente),
    };

    const saved = await this.insertSolicitud(payload);
    await this.registrarBitacora(cliente.id_usuario, 'CREATE_REQUEST', 'solicitud_servicio');
    return this.present(saved, perfil, servicio);
  }

  async listClient(cliente: UsuarioRow) {
    const rows = await this.findRequests('id_cliente', cliente.id_usuario);
    return this.presentMany(rows);
  }

  async listWorker(usuario: UsuarioRow) {
    const perfil = await this.findPerfilByUser(usuario.id_usuario);
    if (!perfil) {
      throw new NotFoundException('Aún no tienes un perfil de trabajador.');
    }
    const rows = await this.findRequests('id_trabajador', perfil.id_perfil);
    return this.presentMany(rows);
  }

  async updateStatus(usuario: UsuarioRow, idSolicitud: number, dto: UpdateRequestStatusDto) {
    const perfil = await this.findPerfilByUser(usuario.id_usuario);
    if (!perfil) throw new NotFoundException('Aún no tienes un perfil de trabajador.');
    const request = await this.findRequest(idSolicitud);
    if (!request) throw new NotFoundException('La solicitud no existe.');
    if (request.id_trabajador !== perfil.id_perfil) {
      throw new ForbiddenException('Solo el trabajador asignado puede gestionar esta solicitud.');
    }
    const current = request.estado as RequestStatus;
    if (!WORKER_TRANSITIONS[current]?.includes(dto.estado)) {
      throw new BadRequestException(`No se puede cambiar una solicitud de ${request.estado} a ${dto.estado}.`);
    }
    const { data, error } = await this.supabase
      .from('solicitud_servicio')
      .update({ estado: dto.estado })
      .eq('id_solicitud', idSolicitud)
      .eq('estado', request.estado)
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new ConflictException('La solicitud cambió mientras la estabas gestionando. Actualiza el panel.');
    await this.registrarBitacora(usuario.id_usuario, `REQUEST_${dto.estado.toUpperCase().replace(/ /g, '_')}`, 'solicitud_servicio');
    return (await this.presentMany([data as SolicitudRow]))[0];
  }

  async createReview(cliente: UsuarioRow, idSolicitud: number, dto: CreateReviewDto) {
    const request = await this.findRequest(idSolicitud);
    if (!request) throw new NotFoundException('La solicitud no existe.');
    if (request.id_cliente !== cliente.id_usuario) {
      throw new ForbiddenException('Solo el cliente de esta solicitud puede calificarla.');
    }
    if (request.estado !== 'Completada') {
      throw new BadRequestException('Solo puedes calificar una solicitud completada.');
    }
    const existing = await this.findReview(idSolicitud);
    if (existing) throw new ConflictException('Esta solicitud ya fue calificada.');
    const payload = {
      id_solicitud: request.id_solicitud,
      id_cliente: cliente.id_usuario,
      id_trabajador: request.id_trabajador,
      calificacion: dto.calificacion,
      comentario: dto.comentario?.trim() || null,
      fecha: new Date().toISOString(),
    };
    const saved = await this.insertReview(payload);
    await this.registrarBitacora(cliente.id_usuario, 'CREATE_REVIEW', 'resena');
    return saved;
  }

  private async presentMany(rows: SolicitudRow[]) {
    const profileIds = [...new Set(rows.map((row) => row.id_trabajador))];
    const serviceIds = [...new Set(rows.map((row) => row.id_servicio))];
    const clientIds = [...new Set(rows.map((row) => row.id_cliente))];
    const requestIds = rows.map((row) => row.id_solicitud);
    const [profiles, services, clients, reviews] = await Promise.all([
      this.loadMap('perfil_trabajador', 'id_perfil', profileIds, 'id_perfil, id_usuario, oficio_principal, disponibilidad'),
      this.loadMap('servicio_ofrecido', 'id_servicio', serviceIds, 'id_servicio, id_perfil, nombre, descripcion, activo'),
      this.loadMap('usuario', 'id_usuario', clientIds, 'id_usuario, nombre, telefono'),
      this.loadMap('resena', 'id_solicitud', requestIds, 'id_resena, id_solicitud, calificacion, comentario, fecha'),
    ]);
    const ownerIds = [...new Set([...profiles.values()].map((profile) => Number(profile.id_usuario)))];
    const owners = await this.loadMap('usuario', 'id_usuario', ownerIds, 'id_usuario, nombre, telefono');
    return rows.map((row) => {
      const profile = profiles.get(row.id_trabajador);
      const service = services.get(row.id_servicio);
      const client = clients.get(row.id_cliente);
      const owner = profile ? owners.get(Number(profile.id_usuario)) : null;
      const review = reviews.get(row.id_solicitud);
      return {
        ...row,
        cliente: client ? { id_usuario: client.id_usuario, nombre: client.nombre, telefono: client.telefono } : null,
        trabajador: profile ? { id_perfil: profile.id_perfil, nombre: owner?.nombre || 'Trabajador', oficio_principal: profile.oficio_principal } : null,
        servicio: service ? { id_servicio: service.id_servicio, nombre: service.nombre } : null,
        resena: review || null,
      };
    });
  }

  private async loadMap(table: string, key: string, ids: number[], select: string) {
    const map = new Map<number, Record<string, any>>();
    if (!ids.length) return map;
    const { data, error } = await this.supabase.from(table).select(select).in(key, ids);
    if (error) throw new BadRequestException(error.message);
    for (const row of data || []) map.set(Number((row as any)[key]), row as Record<string, any>);
    return map;
  }

  private async findRequests(key: 'id_cliente' | 'id_trabajador', value: number) {
    const { data, error } = await this.supabase
      .from('solicitud_servicio')
      .select('*')
      .eq(key, value)
      .order('id_solicitud', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return (data || []) as SolicitudRow[];
  }

  private async findRequest(idSolicitud: number) {
    const { data, error } = await this.supabase
      .from('solicitud_servicio').select('*').eq('id_solicitud', idSolicitud).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return (data as SolicitudRow) || null;
  }

  private async findReview(idSolicitud: number) {
    const { data, error } = await this.supabase
      .from('resena').select('*').eq('id_solicitud', idSolicitud).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return (data as ReviewRow) || null;
  }

  private async insertReview(payload: Record<string, unknown>) {
    const { data, error } = await this.supabase.from('resena').insert(payload).select('*').single();
    if (!error && data) return data as ReviewRow;
    if (/null value in column ["']?id_resena["']?/i.test(error?.message || '')) {
      const nextId = await this.nextId('resena', 'id_resena');
      const { data: retry, error: retryError } = await this.supabase
        .from('resena').insert({ ...payload, id_resena: nextId }).select('*').single();
      if (!retryError && retry) return retry as ReviewRow;
      throw new BadRequestException(retryError?.message || 'No se pudo guardar la calificación.');
    }
    throw new BadRequestException(error?.message || 'No se pudo guardar la calificación.');
  }

  private present(row: SolicitudRow, perfil: PerfilRow, servicio: ServicioRow) {
    return {
      id_solicitud: row.id_solicitud,
      id_cliente: row.id_cliente,
      id_trabajador: row.id_trabajador,
      id_servicio: row.id_servicio,
      descripcion: row.descripcion,
      ubicacion_aprox: row.ubicacion_aprox,
      fecha_deseada: row.fecha_deseada,
      estado: row.estado,
      urgente: row.urgente,
      trabajador: {
        id_perfil: perfil.id_perfil,
        oficio_principal: perfil.oficio_principal,
      },
      servicio: {
        id_servicio: servicio.id_servicio,
        nombre: servicio.nombre,
      },
    };
  }

  private async findPerfil(idPerfil: number) {
    const { data, error } = await this.supabase
      .from('perfil_trabajador')
      .select('id_perfil, id_usuario, oficio_principal, disponibilidad')
      .eq('id_perfil', idPerfil)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return (data as PerfilRow) || null;
  }

  private async findPerfilByUser(idUsuario: number) {
    const { data, error } = await this.supabase
      .from('perfil_trabajador')
      .select('id_perfil, id_usuario, oficio_principal, disponibilidad')
      .eq('id_usuario', idUsuario)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return (data as PerfilRow) || null;
  }

  private async findServicio(idServicio: number) {
    const { data, error } = await this.supabase
      .from('servicio_ofrecido')
      .select('id_servicio, id_perfil, id_categoria, nombre, descripcion, activo')
      .eq('id_servicio', idServicio)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return (data as ServicioRow) || null;
  }

  private async findUsuario(idUsuario: number) {
    const { data, error } = await this.supabase
      .from('usuario')
      .select('id_usuario, modo_activo, estado')
      .eq('id_usuario', idUsuario)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data as { id_usuario: number; modo_activo: boolean; estado: string } | null;
  }

  private async insertSolicitud(payload: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from('solicitud_servicio')
      .insert(payload)
      .select('*')
      .single();

    if (!error && data) return data as SolicitudRow;

    if (/null value in column ["']?id_solicitud["']?/i.test(error?.message || '')) {
      const nextId = await this.nextId('solicitud_servicio', 'id_solicitud');
      const { data: retry, error: retryError } = await this.supabase
        .from('solicitud_servicio')
        .insert({ ...payload, id_solicitud: nextId })
        .select('*')
        .single();
      if (retryError || !retry) {
        throw this.mapInsertError(retryError?.message);
      }
      return retry as SolicitudRow;
    }

    throw this.mapInsertError(error?.message);
  }

  private mapInsertError(message?: string): never {
    if (message && /duplicate|unique/i.test(message)) {
      throw new ConflictException('Ya existe una solicitud similar.');
    }
    throw new BadRequestException(message || 'No se pudo crear la solicitud.');
  }

  private async nextId(
    table: 'solicitud_servicio' | 'bitacora' | 'resena',
    pk: 'id_solicitud' | 'id_evento' | 'id_resena',
  ) {
    const { data } = await this.supabase
      .from(table)
      .select(pk)
      .order(pk, { ascending: false })
      .limit(1);
    const row = (data?.[0] || {}) as Record<string, number>;
    return (Number(row[pk]) || 0) + 1;
  }

  private async registrarBitacora(idActor: number, accion: string, recurso: string) {
    const payload = {
      id_actor: idActor,
      accion,
      recurso,
      origen: 'api/requests',
    };
    const { error } = await this.supabase.from('bitacora').insert(payload);
    if (!error) return;
    if (/null value in column ["']?id_evento["']?/i.test(error.message)) {
      const nextId = await this.nextId('bitacora', 'id_evento');
      await this.supabase.from('bitacora').insert({ ...payload, id_evento: nextId });
    }
  }
}
