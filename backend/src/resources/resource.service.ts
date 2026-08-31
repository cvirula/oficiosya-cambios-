import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ResourceConfig } from './resources.config';

@Injectable()
export class ResourceService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(config: ResourceConfig, query: Record<string, string>) {
    let builder = this.supabase.from(config.table).select('*');

    for (const [key, value] of Object.entries(query)) {
      if (['select', 'limit', 'offset', 'order'].includes(key)) continue;
      if (value === undefined || value === '') continue;
      builder = builder.eq(key, value);
    }

    if (query.limit) builder = builder.limit(Number(query.limit));
    if (query.offset) {
      const from = Number(query.offset);
      const to = from + Number(query.limit || 50) - 1;
      builder = builder.range(from, to);
    }
    if (query.order) {
      const [column, direction] = query.order.split(':');
      builder = builder.order(column, { ascending: direction !== 'desc' });
    }

    const { data, error } = await builder;
    if (error) throw new BadRequestException(error.message);
    return this.sanitize(config, data || []);
  }

  async findOne(config: ResourceConfig, keys: Record<string, string | number>) {
    let builder = this.supabase.from(config.table).select('*');
    for (const [key, value] of Object.entries(keys)) {
      builder = builder.eq(key, value);
    }

    const { data, error } = await builder.maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Recurso no encontrado.');
    return this.sanitize(config, data);
  }

  async create(config: ResourceConfig, body: Record<string, unknown>) {
    const payload = this.stripHidden(config, body);
    const { data, error } = await this.supabase
      .from(config.table)
      .insert(payload)
      .select('*')
      .single();

    if (!error && data) return this.sanitize(config, data);

    if (this.needsGeneratedId(config, error?.message)) {
      const pk = Array.isArray(config.pk) ? null : config.pk;
      if (!pk) throw new BadRequestException(error?.message);
      const nextId = await this.nextId(config.table, pk);
      const { data: retry, error: retryError } = await this.supabase
        .from(config.table)
        .insert({ ...payload, [pk]: nextId })
        .select('*')
        .single();
      if (retryError || !retry) {
        throw new BadRequestException(retryError?.message || 'No se pudo crear el recurso.');
      }
      return this.sanitize(config, retry);
    }

    throw new BadRequestException(error?.message || 'No se pudo crear el recurso.');
  }

  async update(
    config: ResourceConfig,
    keys: Record<string, string | number>,
    body: Record<string, unknown>,
  ) {
    await this.findOne(config, keys);
    const payload = this.stripHidden(config, body);

    let builder = this.supabase.from(config.table).update(payload);
    for (const [key, value] of Object.entries(keys)) {
      builder = builder.eq(key, value);
    }

    const { data, error } = await builder.select('*').single();
    if (error || !data) {
      throw new BadRequestException(error?.message || 'No se pudo actualizar el recurso.');
    }
    return this.sanitize(config, data);
  }

  async remove(config: ResourceConfig, keys: Record<string, string | number>) {
    await this.findOne(config, keys);

    let builder = this.supabase.from(config.table).delete();
    for (const [key, value] of Object.entries(keys)) {
      builder = builder.eq(key, value);
    }

    const { error } = await builder;
    if (error) throw new BadRequestException(error.message);
    return { message: 'Recurso eliminado.' };
  }

  private sanitize(config: ResourceConfig, data: unknown) {
    if (Array.isArray(data)) {
      return data.map((row) => this.sanitize(config, row));
    }
    if (!data || typeof data !== 'object') return data;
    const copy = { ...(data as Record<string, unknown>) };
    for (const field of config.hiddenFields || []) {
      delete copy[field];
    }
    return copy;
  }

  private stripHidden(config: ResourceConfig, body: Record<string, unknown>) {
    const copy = { ...body };
    for (const field of config.hiddenFields || []) {
      delete copy[field];
    }
    return copy;
  }

  private needsGeneratedId(config: ResourceConfig, message?: string) {
    if (!message || Array.isArray(config.pk)) return false;
    return new RegExp(`null value in column ["']?${config.pk}["']?`, 'i').test(message);
  }

  private async nextId(table: string, pk: string) {
    const { data } = await this.supabase
      .from(table)
      .select(pk)
      .order(pk, { ascending: false })
      .limit(1);
    return (Number(data?.[0]?.[pk]) || 0) + 1;
  }
}
