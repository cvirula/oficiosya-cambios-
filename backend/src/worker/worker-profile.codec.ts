import { HorarioDto } from './dto/horario.dto';
import { TarifasDto } from './dto/tarifas.dto';

type Extras = {
  bio: string;
  tarifas: TarifasDto | null;
  horarios: HorarioDto[];
};

export function parseProfileExtras(descripcion: string | null | undefined): Extras {
  const raw = (descripcion || '').trim();
  if (!raw) {
    return { bio: '', tarifas: null, horarios: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 1 && typeof parsed === 'object') {
      return {
        bio: typeof parsed.bio === 'string' ? parsed.bio : '',
        tarifas: parsed.tarifas && typeof parsed.tarifas === 'object' ? parsed.tarifas : null,
        horarios: Array.isArray(parsed.horarios) ? parsed.horarios : [],
      };
    }
  } catch {
    // texto libre previo
  }

  return { bio: raw, tarifas: null, horarios: [] };
}

export function serializeProfileExtras(input: {
  bio: string;
  tarifas?: TarifasDto | null;
  horarios?: HorarioDto[];
}) {
  return JSON.stringify({
    v: 1,
    bio: input.bio || '',
    tarifas: input.tarifas || null,
    horarios: input.horarios || [],
  });
}

export function normalizeDisponibilidad(value?: string | null) {
  return value === 'Ocupado' ? 'Ocupado' : 'Disponible';
}

export function toggleDisponibilidad(value?: string | null) {
  return normalizeDisponibilidad(value) === 'Disponible' ? 'Ocupado' : 'Disponible';
}
