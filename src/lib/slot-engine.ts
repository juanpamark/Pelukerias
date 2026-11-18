import type {
  BookingRecord,
  PublicStaffDTO,
  PublicTenantDTO,
  TimeSlot,
} from "@/types/velociturno";

export type RestReason = "shop_closed" | "barber_rest" | null;

export const WEEKDAY_OPTIONS: Array<{
  day: number;
  short: string;
  label: string;
}> = [
  { day: 1, short: "L", label: "Lun" },
  { day: 2, short: "M", label: "Mar" },
  { day: 3, short: "X", label: "Mié" },
  { day: 4, short: "J", label: "Jue" },
  { day: 5, short: "V", label: "Vie" },
  { day: 6, short: "S", label: "Sáb" },
  { day: 0, short: "D", label: "Dom" },
];

export function getWeekdayFromISO(dateISO: string): number {
  const [year, month, day] = dateISO.split("-").map(Number);
  if (!year || !month || !day) return 0;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function isShopClosedOnDate(
  date: string,
  tenant?: Pick<PublicTenantDTO, "closedWeekdays" | "closedDates">
): boolean {
  if (!tenant) return false;
  if (tenant.closedDates?.includes(date)) return true;
  const weekday = getWeekdayFromISO(date);
  return Boolean(tenant.closedWeekdays?.includes(weekday));
}

export function getRestStatusForDate(params: {
  date: string;
  staff: Pick<PublicStaffDTO, "isActive" | "restWeekdays" | "restDates">;
  tenant?: Pick<PublicTenantDTO, "closedWeekdays" | "closedDates">;
}): RestReason {
  const { date, staff, tenant } = params;

  if (isShopClosedOnDate(date, tenant)) {
    return "shop_closed";
  }

  if (!staff.isActive) {
    return "barber_rest";
  }

  if (staff.restDates?.includes(date)) {
    return "barber_rest";
  }

  const weekday = getWeekdayFromISO(date);
  if (staff.restWeekdays?.includes(weekday)) {
    return "barber_rest";
  }

  return null;
}

export function timeStrToMinutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

export function minutesToTimeStr(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function formatMinutesTo12h(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const period = hours24 >= 12 ? "p. m." : "a. m.";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
}

interface Interval {
  start: number;
  end: number;
}

/**
 * Motor Anti-Huecos (Zero-Gap Slot Availability Engine):
 * 1. Toma la jornada laboral del barbero y descuenta bloqueos/almuerzo y citas activas.
 * 2. Calcula ventanas continuas libres [freeStart, freeEnd].
 * 3. Dentro de cada ventana libre, alinea los bloques exactamente al minuto en que
 *    termina la cita anterior (ej. si un corte de 45 min termina a las 9:45, ofrece 9:45 en punto),
 *    evitando tiempos muertos de 15 min que harían perder turnos al barbero.
 * 4. Descarta cualquier espacio donde el servicio completo no quepa o deje huecos huérfanos < 15 min
 *    entre citas consecutivas cuando hay un ajuste exacto disponible.
 */
export function calculateAvailableSlots(params: {
  staff: PublicStaffDTO;
  date: string;
  serviceDurationMinutes: number;
  bookings: BookingRecord[];
  tenant?: Pick<PublicTenantDTO, "closedWeekdays" | "closedDates">;
  minSlotGap?: number;
}): TimeSlot[] {
  const {
    staff,
    date,
    serviceDurationMinutes,
    bookings,
    tenant,
    minSlotGap = 15,
  } = params;

  if (getRestStatusForDate({ date, staff, tenant }) !== null) {
    return [];
  }

  const workStart = timeStrToMinutes(staff.workStart);
  const workEnd = timeStrToMinutes(staff.workEnd);

  // Recolectar intervalos ocupados (citas válidas + descanso/almuerzo)
  const occupied: Interval[] = bookings
    .filter(
      (b) =>
        b.staffId === staff.id &&
        b.date === date &&
        b.status !== "cancelled" &&
        b.status !== "no_show"
    )
    .map((b) => ({
      start: timeStrToMinutes(b.startTime),
      end: timeStrToMinutes(b.endTime),
    }));

  if (staff.breakStart && staff.breakEnd) {
    occupied.push({
      start: timeStrToMinutes(staff.breakStart),
      end: timeStrToMinutes(staff.breakEnd),
    });
  }

  // Ordenar intervalos ocupados y fusionar solapamientos
  occupied.sort((a, b) => a.start - b.start);
  const mergedOccupied: Interval[] = [];
  for (const interval of occupied) {
    const clampedStart = Math.max(workStart, interval.start);
    const clampedEnd = Math.min(workEnd, interval.end);
    if (clampedStart >= clampedEnd) continue;

    const last = mergedOccupied[mergedOccupied.length - 1];
    if (last && clampedStart <= last.end) {
      last.end = Math.max(last.end, clampedEnd);
    } else {
      mergedOccupied.push({ start: clampedStart, end: clampedEnd });
    }
  }

  // Extraer ventanas completamente libres
  const freeWindows: Interval[] = [];
  let cursor = workStart;

  for (const occ of mergedOccupied) {
    if (occ.start > cursor) {
      freeWindows.push({ start: cursor, end: occ.start });
    }
    cursor = Math.max(cursor, occ.end);
  }
  if (cursor < workEnd) {
    freeWindows.push({ start: cursor, end: workEnd });
  }

  const slots: TimeSlot[] = [];

  for (const window of freeWindows) {
    const windowLength = window.end - window.start;
    if (windowLength < serviceDurationMinutes) {
      continue;
    }

    // Generamos candidatos avanzando desde window.start con pasos inteligentes:
    // Si el bloque anterior terminó a las 09:45, el primer candidato es 09:45 (cero huecos).
    const step = 15;
    let t = window.start;

    while (t + serviceDurationMinutes <= window.end) {
      const gapBefore = t - window.start;
      const gapAfter = window.end - (t + serviceDurationMinutes);

      // Regla Anti-Hueco:
      // Evitamos ofrecer un horario que deje un micro-hueco inservible (>0 y < minSlotGap)
      // justo antes de la cita o justo antes del próximo compromiso.
      const leavesOrphanBefore = gapBefore > 0 && gapBefore < minSlotGap;
      const leavesOrphanAfter = gapAfter > 0 && gapAfter < minSlotGap;

      if (!leavesOrphanBefore && !leavesOrphanAfter) {
        const isOptimalPack =
          t === window.start || t + serviceDurationMinutes === window.end;

        slots.push({
          startTime: minutesToTimeStr(t),
          endTime: minutesToTimeStr(t + serviceDurationMinutes),
          label: formatMinutesTo12h(t),
          isOptimalPack,
        });
      }

      // Avanzamos de 30 en 30 minutos normalmente, o de 15 en 15 para ajustar a bordes exactos
      t += step;
    }
  }

  return slots;
}
