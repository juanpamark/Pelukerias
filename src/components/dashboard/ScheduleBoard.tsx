"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Ban,
  CalendarOff,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  MessageCircle,
  Play,
  Plus,
  Receipt,
  RotateCcw,
  Undo2,
  UserX,
  X,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { isLocalPreviewUrl } from "@/lib/media";
import { UPCOMING_SCHEDULE_DAYS } from "@/lib/mock-data";
import {
  getRestStatusForDate,
  isShopClosedOnDate,
  minutesToTimeStr,
  timeStrToMinutes,
} from "@/lib/slot-engine";
import { cn, createTempId, formatCOP, formatWhatsAppUrl } from "@/lib/utils";
import type {
  BookingRecord,
  BookingStatus,
  PublicServiceDTO,
  PublicStaffDTO,
  PublicTenantDTO,
} from "@/types/velociturno";

interface ScheduleBoardProps {
  tenant: PublicTenantDTO;
  bookings: BookingRecord[];
  staff: PublicStaffDTO[];
  services: PublicServiceDTO[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeBarberId: string | null;
  onlyPendingFilter: boolean;
  onTogglePendingFilter: () => void;
  onUpdateBookingStatus: (id: string, status: BookingStatus) => void;
  onAddBooking: (booking: BookingRecord) => void;
  onToggleShopClosedDate: (date: string) => void;
  onToggleBarberRestDate: (staffId: string, date: string) => void;
}

const STATUS_META: Record<
  BookingStatus,
  { label: string; badgeClass: string; cardBorderClass: string }
> = {
  confirmed: {
    label: "Confirmada",
    badgeClass: "border-zinc-200 bg-zinc-100 text-zinc-800",
    cardBorderClass: "border-zinc-200 bg-white",
  },
  pending_verification: {
    label: "Verificar 50%",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    cardBorderClass: "border-amber-300 bg-amber-50/35",
  },
  in_chair: {
    label: "En silla",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    cardBorderClass: "border-emerald-300 bg-emerald-50/35",
  },
  completed: {
    label: "Completada",
    badgeClass: "border-zinc-200 bg-zinc-100 text-zinc-600",
    cardBorderClass: "border-zinc-200 bg-zinc-50/80 opacity-85",
  },
  cancelled: {
    label: "Cancelada",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    cardBorderClass: "border-rose-200/80 bg-rose-50/30",
  },
  no_show: {
    label: "No asistió",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    cardBorderClass: "border-rose-200/80 bg-rose-50/30",
  },
  blocked: {
    label: "Hora bloqueada",
    badgeClass: "border-zinc-300 bg-zinc-200/80 text-zinc-700",
    cardBorderClass: "border-dashed border-zinc-300 bg-zinc-100/75",
  },
};

function isArchivedStatus(status: BookingStatus): boolean {
  return status === "cancelled" || status === "no_show";
}

export function ScheduleBoard({
  tenant,
  bookings,
  staff,
  services,
  selectedDate,
  onSelectDate,
  activeBarberId,
  onlyPendingFilter,
  onTogglePendingFilter,
  onUpdateBookingStatus,
  onAddBooking,
  onToggleShopClosedDate,
  onToggleBarberRestDate,
}: ScheduleBoardProps) {
  const [mobileStaffFilter, setMobileStaffFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(true);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [inspectingBooking, setInspectingBooking] = useState<BookingRecord | null>(null);
  const [reactivateConflict, setReactivateConflict] = useState<{
    bookingId: string;
    message: string;
  } | null>(null);

  // Estado formulario Cita Rápida (Walk-in)
  const [wkStaffId, setWkStaffId] = useState(activeBarberId || staff[0]?.id || "");
  const [wkServiceId, setWkServiceId] = useState(services[0]?.id || "");
  const [wkCustomerName, setWkCustomerName] = useState("");
  const [wkStartTime, setWkStartTime] = useState("12:00");

  // Estado formulario Bloqueo Rápido
  const [blkStaffId, setBlkStaffId] = useState(activeBarberId || staff[0]?.id || "");
  const [blkStartTime, setBlkStartTime] = useState("16:30");
  const [blkDuration, setBlkDuration] = useState(60);
  const [blkReason, setBlkReason] = useState("Almuerzo / Diligencia");

  const focusedBarber = useMemo(
    () => (activeBarberId ? staff.find((s) => s.id === activeBarberId) || null : null),
    [activeBarberId, staff]
  );

  // Conteo de citas activas por fecha para los chips de calendario
  const countsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      if (activeBarberId && b.staffId !== activeBarberId) continue;
      if (isArchivedStatus(b.status) || b.status === "blocked") continue;
      map.set(b.date, (map.get(b.date) || 0) + 1);
    }
    return map;
  }, [bookings, activeBarberId]);

  const dayBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (b.date !== selectedDate) return false;
        if (activeBarberId && b.staffId !== activeBarberId) return false;
        if (onlyPendingFilter && b.status !== "pending_verification") return false;
        return true;
      })
      .sort((a, b) => timeStrToMinutes(a.startTime) - timeStrToMinutes(b.startTime));
  }, [bookings, selectedDate, activeBarberId, onlyPendingFilter]);

  const pendingVerificationCount = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.date === selectedDate &&
          (!activeBarberId || b.staffId === activeBarberId) &&
          b.status === "pending_verification"
      ).length,
    [bookings, selectedDate, activeBarberId]
  );

  const archivedCount = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.date === selectedDate &&
          (!activeBarberId || b.staffId === activeBarberId) &&
          isArchivedStatus(b.status)
      ).length,
    [bookings, selectedDate, activeBarberId]
  );

  const mobileFilteredBookings = useMemo(() => {
    const visible = showArchived
      ? dayBookings
      : dayBookings.filter((b) => !isArchivedStatus(b.status));

    if (activeBarberId || mobileStaffFilter === "all") {
      // Ordenar activas primero y canceladas/no-show al final
      return [
        ...visible.filter((b) => !isArchivedStatus(b.status)),
        ...visible.filter((b) => isArchivedStatus(b.status)),
      ];
    }

    const byStaff = visible.filter((b) => b.staffId === mobileStaffFilter);
    return [
      ...byStaff.filter((b) => !isArchivedStatus(b.status)),
      ...byStaff.filter((b) => isArchivedStatus(b.status)),
    ];
  }, [dayBookings, activeBarberId, mobileStaffFilter, showArchived]);

  const openWalkInModal = (preferredStaffId?: string) => {
    setWkStaffId(preferredStaffId || activeBarberId || staff[0]?.id || "");
    setWkServiceId(services[0]?.id || "");
    setWalkInOpen(true);
  };

  const openBlockModal = (preferredStaffId?: string) => {
    setBlkStaffId(preferredStaffId || activeBarberId || staff[0]?.id || "");
    setBlockOpen(true);
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenStaff = staff.find((s) => s.id === wkStaffId) || staff[0];
    const chosenService = services.find((s) => s.id === wkServiceId) || services[0];
    if (!chosenStaff || !chosenService) return;

    const override = chosenService.staffOverrides?.find(
      (o) => o.staffId === chosenStaff.id
    );
    const price = override?.price ?? chosenService.basePrice;
    const duration = override?.durationMinutes ?? chosenService.durationMinutes;
    const endMinutes = timeStrToMinutes(wkStartTime) + duration;

    onAddBooking({
      id: createTempId("bk-walkin"),
      tenantSlug: tenant.slug,
      staffId: chosenStaff.id,
      serviceId: chosenService.id,
      serviceName: chosenService.name,
      staffName: chosenStaff.name,
      customerName: wkCustomerName.trim() || "Cliente Walk-in",
      customerPhone: "En local",
      date: selectedDate,
      startTime: wkStartTime,
      endTime: minutesToTimeStr(endMinutes),
      durationMinutes: duration,
      totalPrice: price,
      depositRequired: false,
      depositAmount: 0,
      status: "in_chair",
      note: "Registrado en local (sin cita previa)",
    });

    setWkCustomerName("");
    setWalkInOpen(false);
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenStaff = staff.find((s) => s.id === blkStaffId) || staff[0];
    if (!chosenStaff) return;

    const endMinutes = timeStrToMinutes(blkStartTime) + blkDuration;

    onAddBooking({
      id: createTempId("bk-block"),
      tenantSlug: tenant.slug,
      staffId: chosenStaff.id,
      serviceId: "block",
      serviceName: blkReason.trim() || "Bloqueo manual",
      staffName: chosenStaff.name,
      customerName: "Espacio bloqueado",
      customerPhone: "-",
      date: selectedDate,
      startTime: blkStartTime,
      endTime: minutesToTimeStr(endMinutes),
      durationMinutes: blkDuration,
      totalPrice: 0,
      depositRequired: false,
      depositAmount: 0,
      status: "blocked",
    });

    setBlockOpen(false);
  };

  const handleAttemptReactivate = (booking: BookingRecord) => {
    setReactivateConflict(null);
    const targetStart = timeStrToMinutes(booking.startTime);
    const targetEnd = timeStrToMinutes(booking.endTime);

    // Verificar si otro turno o bloqueo ya ocupó ese rango horario del mismo barbero
    const conflict = bookings.find((other) => {
      if (other.id === booking.id) return false;
      if (other.staffId !== booking.staffId || other.date !== booking.date) return false;
      if (isArchivedStatus(other.status)) return false;

      const otherStart = timeStrToMinutes(other.startTime);
      const otherEnd = timeStrToMinutes(other.endTime);
      return targetStart < otherEnd && otherStart < targetEnd;
    });

    if (conflict) {
      setReactivateConflict({
        bookingId: booking.id,
        message: `El espacio (${booking.startTime} – ${booking.endTime}) ya está ocupado por ${conflict.customerName}. Crea una cita rápida en otra hora libre.`,
      });
      return;
    }

    onUpdateBookingStatus(
      booking.id,
      booking.serviceId === "block" ? "blocked" : "confirmed"
    );
  };

  const selectedDayInfo =
    UPCOMING_SCHEDULE_DAYS.find((d) => d.date === selectedDate) ||
    UPCOMING_SCHEDULE_DAYS[0];

  const isSelectedShopClosed = isShopClosedOnDate(selectedDate, tenant);
  const isSelectedShopClosedBySpecificDate = Boolean(
    tenant.closedDates?.includes(selectedDate)
  );
  const focusedBarberRestReason = focusedBarber
    ? getRestStatusForDate({ date: selectedDate, staff: focusedBarber, tenant })
    : null;
  const isFocusedBarberRestDateOnly = Boolean(
    focusedBarber?.restDates?.includes(selectedDate)
  );
  const activeCountSelectedDay = useMemo(
    () =>
      dayBookings.filter(
        (b) => !isArchivedStatus(b.status) && b.status !== "blocked"
      ).length,
    [dayBookings]
  );

  const renderBookingCard = (booking: BookingRecord, showBarberBadge = false) => {
    const meta = STATUS_META[booking.status];
    const archived = isArchivedStatus(booking.status);
    const hasPhone = Boolean(
      booking.customerPhone &&
        booking.customerPhone !== "-" &&
        booking.customerPhone !== "En local"
    );
    const conflictForThis =
      reactivateConflict?.bookingId === booking.id ? reactivateConflict.message : null;

    return (
      <article
        key={booking.id}
        className={cn(
          "rounded-2xl border p-3.5 transition-colors",
          meta.cardBorderClass,
          archived && "opacity-75 hover:opacity-100"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="tabular-nums text-xs font-bold text-zinc-900">
              {booking.startTime} – {booking.endTime}
            </span>
            {showBarberBadge && (
              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600">
                {booking.staffName.split(" ")[0]}
              </span>
            )}
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-bold",
              meta.badgeClass
            )}
          >
            {meta.label}
          </span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-zinc-950">
            {booking.status === "blocked" ? booking.serviceName : booking.customerName}
          </p>

          {hasPhone && booking.status !== "blocked" && (
            <a
              href={formatWhatsAppUrl(
                booking.customerPhone,
                `Hola ${booking.customerName.split(" ")[0]}, te escribimos de ${tenant.name} sobre tu turno de las ${booking.startTime}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              title={`Escribir por WhatsApp a ${booking.customerName}`}
              className="pressable inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="visually-hidden">WhatsApp a {booking.customerName}</span>
            </a>
          )}
        </div>

        {booking.status !== "blocked" && (
          <div className="mt-0.5 space-y-1">
            <p className="text-xs font-medium text-zinc-600">
              {booking.serviceName} • {booking.durationMinutes} min
            </p>
            <p className="tabular-nums text-xs font-semibold text-zinc-950">
              {formatCOP(booking.totalPrice)}
              {booking.depositRequired && (
                <span className="ml-1.5 font-normal text-zinc-500">
                  (Anticipo 50%: {formatCOP(booking.depositAmount)})
                </span>
              )}
            </p>
          </div>
        )}

        {booking.note && (
          <p className="mt-2 rounded-lg border border-zinc-200/70 bg-white/80 px-2.5 py-1.5 text-[11px] text-zinc-600">
            {booking.note}
          </p>
        )}

        {conflictForThis && (
          <div
            role="alert"
            className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-900"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{conflictForThis}</span>
          </div>
        )}

        {/* Acciones rápidas en 1 tap */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-zinc-200/70 pt-2.5">
          {booking.status === "pending_verification" && (
            <>
              <button
                type="button"
                onClick={() => onUpdateBookingStatus(booking.id, "confirmed")}
                className="pressable inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Aprobar 50%</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectingBooking(booking)}
                className="pressable inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                <Eye className="h-3.5 w-3.5 text-zinc-500" />
                <span>Ver soporte</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateBookingStatus(booking.id, "cancelled")}
                className="pressable inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
              >
                <X className="h-3.5 w-3.5" />
                <span>Rechazar</span>
              </button>
            </>
          )}

          {booking.status === "confirmed" && (
            <>
              <button
                type="button"
                onClick={() => onUpdateBookingStatus(booking.id, "in_chair")}
                className="pressable inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
              >
                <Play className="h-3 w-3" />
                <span>En silla</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateBookingStatus(booking.id, "no_show")}
                className="pressable inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <UserX className="h-3 w-3 text-zinc-500" />
                <span>No asistió</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateBookingStatus(booking.id, "cancelled")}
                className="pressable inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 hover:border-rose-200 hover:text-rose-700"
              >
                <Ban className="h-3 w-3" />
                <span>Cancelar</span>
              </button>
            </>
          )}

          {booking.status === "in_chair" && (
            <>
              <button
                type="button"
                onClick={() => onUpdateBookingStatus(booking.id, "completed")}
                className="pressable inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Terminar corte</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateBookingStatus(booking.id, "confirmed")}
                className="pressable inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                <Undo2 className="h-3 w-3" />
                <span>Volver</span>
              </button>
            </>
          )}

          {booking.status === "completed" && (
            <button
              type="button"
              onClick={() => onUpdateBookingStatus(booking.id, "in_chair")}
              className="pressable inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100"
            >
              <Undo2 className="h-3 w-3" />
              <span>Reabrir a en silla</span>
            </button>
          )}

          {booking.status === "blocked" && (
            <button
              type="button"
              onClick={() => onUpdateBookingStatus(booking.id, "cancelled")}
              className="pressable inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <Check className="h-3 w-3" />
              <span>Liberar espacio</span>
            </button>
          )}

          {archived && (
            <button
              type="button"
              onClick={() => handleAttemptReactivate(booking)}
              className="pressable inline-flex min-h-[34px] w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                {booking.serviceId === "block"
                  ? "Restaurar bloqueo"
                  : "Reactivar turno (llegó / accidental)"}
              </span>
            </button>
          )}
        </div>
      </article>
    );
  };

  // Grid responsivo para columnas del dueño (3 barberos = 3 cols; 4+ = 2/4 cols sin filas huérfanas)
  const desktopGridClass =
    staff.length >= 4
      ? "hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4"
      : staff.length === 2
        ? "hidden gap-4 md:grid md:grid-cols-2"
        : "hidden gap-4 md:grid md:grid-cols-3";

  return (
    <div className="space-y-5">
      {/* Encabezado y Acciones Rápidas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            {focusedBarber
              ? `Mi agenda · ${selectedDayInfo.labelTop} ${selectedDayInfo.labelDay} ${selectedDayInfo.labelMonth}`
              : `Agenda · ${selectedDayInfo.labelTop} ${selectedDayInfo.labelDay} ${selectedDayInfo.labelMonth}`}
          </h2>
          <p className="text-xs text-zinc-500">
            {pendingVerificationCount > 0
              ? `${pendingVerificationCount} comprobante(s) del 50% por revisar y aprobar.`
              : "Todos los anticipos de este día están al día."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {focusedBarber ? (
            <button
              type="button"
              disabled={isSelectedShopClosed}
              onClick={() => onToggleBarberRestDate(focusedBarber.id, selectedDate)}
              className={cn(
                "pressable inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                isFocusedBarberRestDateOnly
                  ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              )}
            >
              <CalendarOff className="h-3.5 w-3.5 text-zinc-500" />
              <span>
                {isSelectedShopClosed
                  ? "Local cerrado"
                  : isFocusedBarberRestDateOnly
                    ? "Quitar descanso"
                    : "Dejar día libre"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRestModalOpen(true)}
              className={cn(
                "pressable inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors",
                isSelectedShopClosed
                  ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
              )}
            >
              <CalendarOff className="h-3.5 w-3.5 text-zinc-500" />
              <span>
                {isSelectedShopClosed ? "Día cerrado" : "Día de descanso"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => openBlockModal()}
            className="pressable inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            <Lock className="h-3.5 w-3.5 text-zinc-500" />
            <span>Bloquear hora</span>
          </button>
          <button
            type="button"
            onClick={() => openWalkInModal()}
            className="pressable inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Cita rápida (Walk-in)</span>
          </button>
        </div>
      </div>

      {/* Selector horizontal de fecha + filtros rápidos */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Seleccionar día de agenda"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {UPCOMING_SCHEDULE_DAYS.map((day) => {
            const active = selectedDate === day.date;
            const count = countsByDate.get(day.date) || 0;
            const shopClosedDay = isShopClosedOnDate(day.date, tenant);
            const barberRestDay = focusedBarber
              ? getRestStatusForDate({
                  date: day.date,
                  staff: focusedBarber,
                  tenant,
                }) !== null
              : false;
            return (
              <button
                key={day.date}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectDate(day.date)}
                className={cn(
                  "pressable flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                  active
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : shopClosedDay || barberRestDay
                      ? "border-zinc-200 bg-zinc-100/80 text-zinc-500 hover:border-zinc-300"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                )}
              >
                <div>
                  <span
                    className={cn(
                      "block text-[10px] font-semibold uppercase tracking-wide",
                      active
                        ? "text-emerald-400"
                        : shopClosedDay || barberRestDay
                          ? "text-amber-700"
                          : "text-zinc-400"
                    )}
                  >
                    {shopClosedDay
                      ? "Cerrado"
                      : barberRestDay
                        ? "Libre"
                        : day.labelTop}
                  </span>
                  <span className="tabular-nums text-xs font-bold">
                    {day.labelDay} {day.labelMonth}
                  </span>
                </div>
                {count > 0 && (
                  <span
                    className={cn(
                      "tabular-nums rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-700"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pendingVerificationCount > 0 && (
            <button
              type="button"
              onClick={onTogglePendingFilter}
              className={cn(
                "pressable inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                onlyPendingFilter
                  ? "border-amber-500 bg-amber-100 text-amber-950"
                  : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              )}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>
                {onlyPendingFilter
                  ? "Mostrando solo 50% por aprobar"
                  : `Solo por aprobar (${pendingVerificationCount})`}
              </span>
            </button>
          )}

          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className={cn(
                "pressable inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                showArchived
                  ? "border-zinc-300 bg-zinc-100 text-zinc-800"
                  : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800"
              )}
            >
              <RotateCcw className="h-3 w-3" />
              <span>
                {showArchived
                  ? `Ocultar cancelados (${archivedCount})`
                  : `Ver cancelados (${archivedCount})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Aviso de Día de Descanso / Cierre del Local */}
      {(isSelectedShopClosed || focusedBarberRestReason !== null) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-xs text-amber-950">
            <CalendarOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold">
                {isSelectedShopClosed
                  ? `Barbería cerrada el ${selectedDayInfo.labelTop} ${selectedDayInfo.labelDay} ${selectedDayInfo.labelMonth}`
                  : `${focusedBarber?.name} tiene día de descanso esta fecha`}
              </p>
              <p className="mt-0.5 text-amber-900">
                {isSelectedShopClosed
                  ? "Nadie puede agendar turnos en línea este día hasta que lo habilites."
                  : "Los clientes no verán horas disponibles contigo este día."}
              </p>
            </div>
          </div>

          {!focusedBarber && isSelectedShopClosedBySpecificDate && (
            <button
              type="button"
              onClick={() => onToggleShopClosedDate(selectedDate)}
              className="pressable inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-3.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
            >
              Volver a abrir este día
            </button>
          )}

          {focusedBarber &&
            !isSelectedShopClosed &&
            isFocusedBarberRestDateOnly && (
              <button
                type="button"
                onClick={() =>
                  onToggleBarberRestDate(focusedBarber.id, selectedDate)
                }
                className="pressable inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-3.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
              >
                Habilitar mi día
              </button>
            )}
        </div>
      )}

      {/* MODO BARBERO ÚNICO (celular y escritorio directo sin columnas extra) */}
      {focusedBarber ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
            <div className="flex items-center gap-3">
              <Image
                src={focusedBarber.avatarUrl}
                alt={`Barbero ${focusedBarber.name}`}
                width={42}
                height={42}
                unoptimized={isLocalPreviewUrl(focusedBarber.avatarUrl)}
                className="h-10 w-10 rounded-full border border-zinc-200 object-cover"
              />
              <div>
                <h3 className="text-sm font-bold text-zinc-950">{focusedBarber.name}</h3>
                <p className="tabular-nums text-xs text-zinc-500">
                  Jornada {focusedBarber.workStart} – {focusedBarber.workEnd}
                  {focusedBarber.breakStart
                    ? ` • Almuerzo ${focusedBarber.breakStart}–${focusedBarber.breakEnd}`
                    : ""}
                </p>
              </div>
            </div>
            <span className="tabular-nums rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700">
              {mobileFilteredBookings.filter((b) => !isArchivedStatus(b.status)).length}{" "}
              activos
            </span>
          </header>

          {mobileFilteredBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 p-8 text-center">
              <p className="text-sm font-semibold text-zinc-700">
                No tienes turnos para mostrar en este día
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Registra una cita presencial rápida o cambia de fecha arriba.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {mobileFilteredBookings.map((booking) => renderBookingCard(booking, false))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* VISTA MÓVIL DUEÑO: Lista cronológica + filtro rápido */}
          <div className="space-y-4 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setMobileStaffFilter("all")}
                className={cn(
                  "pressable shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold",
                  mobileStaffFilter === "all"
                    ? "bg-zinc-950 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600"
                )}
              >
                Todos ({dayBookings.filter((b) => !isArchivedStatus(b.status)).length})
              </button>
              {staff.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setMobileStaffFilter(person.id)}
                  className={cn(
                    "pressable shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold",
                    mobileStaffFilter === person.id
                      ? "bg-zinc-950 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600"
                  )}
                >
                  {person.name.split(" ")[0]}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {mobileFilteredBookings.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                  No hay turnos para este filtro en {selectedDayInfo.labelTop.toLowerCase()}.
                </div>
              ) : (
                mobileFilteredBookings.map((booking) =>
                  renderBookingCard(booking, mobileStaffFilter === "all")
                )
              )}
            </div>
          </div>

          {/* VISTA DESKTOP / TABLET DUEÑO: Columnas Multi-Sillón */}
          <div className={desktopGridClass}>
            {staff.map((person) => {
              const allForStaff = dayBookings.filter((b) => b.staffId === person.id);
              const activeForStaff = allForStaff.filter(
                (b) => !isArchivedStatus(b.status)
              );
              const archivedForStaff = allForStaff.filter((b) =>
                isArchivedStatus(b.status)
              );
              const staffRestStatus = getRestStatusForDate({
                date: selectedDate,
                staff: person,
                tenant,
              });
              const hasRestDateOnly = Boolean(
                person.restDates?.includes(selectedDate)
              );

              return (
                <section
                  key={person.id}
                  className={cn(
                    "flex flex-col rounded-2xl border p-3.5",
                    staffRestStatus
                      ? "border-dashed border-amber-300 bg-amber-50/25"
                      : "border-zinc-200 bg-zinc-100/60"
                  )}
                >
                  <header className="mb-3 flex items-center justify-between border-b border-zinc-200/80 pb-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Image
                        src={person.avatarUrl}
                        alt={`Barbero ${person.name}`}
                        width={36}
                        height={36}
                        unoptimized={isLocalPreviewUrl(person.avatarUrl)}
                        className="h-9 w-9 shrink-0 rounded-full border border-zinc-200 object-cover"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-zinc-950">
                          {person.name}
                        </h3>
                        <p className="tabular-nums text-[11px] text-zinc-500">
                          {staffRestStatus
                            ? "En descanso este día"
                            : `${person.workStart} – ${person.workEnd}`}
                        </p>
                      </div>
                    </div>
                    <span className="tabular-nums shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-bold text-zinc-800">
                      {activeForStaff.length}
                    </span>
                  </header>

                  <div className="flex-1 space-y-2.5">
                    {staffRestStatus && activeForStaff.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-amber-200 bg-white/80 p-4 text-center space-y-2">
                        <p className="text-xs font-semibold text-amber-900">
                          {staffRestStatus === "shop_closed"
                            ? "Local cerrado este día"
                            : "Día libre (sin agenda web)"}
                        </p>
                        {staffRestStatus === "barber_rest" && hasRestDateOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              onToggleBarberRestDate(person.id, selectedDate)
                            }
                            className="pressable rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            Habilitar día
                          </button>
                        )}
                      </div>
                    ) : activeForStaff.length === 0 &&
                      (!showArchived || archivedForStaff.length === 0) ? (
                      <p className="py-8 text-center text-xs text-zinc-400">
                        Sin turnos para este día
                      </p>
                    ) : (
                      <>
                        {activeForStaff.map((booking) =>
                          renderBookingCard(booking, false)
                        )}
                        {showArchived && archivedForStaff.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Cancelados / No asistió ({archivedForStaff.length})
                            </p>
                            {archivedForStaff.map((booking) =>
                              renderBookingCard(booking, false)
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {person.breakStart && (
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-zinc-300 bg-white/80 px-3 py-2 text-[11px] text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Almuerzo
                      </span>
                      <span className="tabular-nums font-semibold text-zinc-700">
                        {person.breakStart} – {person.breakEnd}
                      </span>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* Modal: Inspeccionar Soporte del 50% */}
      <ModalDialog
        open={Boolean(inspectingBooking)}
        onClose={() => setInspectingBooking(null)}
        title="Revisar comprobante del 50%"
        subtitle="Confirma la transferencia en tu Nequi o Llave Bre-B antes de aprobar"
      >
        {inspectingBooking && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Cliente</span>
                <span className="font-bold text-zinc-950">
                  {inspectingBooking.customerName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Servicio y barbero</span>
                <span className="font-semibold text-zinc-800">
                  {inspectingBooking.serviceName} •{" "}
                  {inspectingBooking.staffName.split(" ")[0]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Hora reservada</span>
                <span className="tabular-nums font-bold text-zinc-950">
                  {inspectingBooking.startTime} – {inspectingBooking.endTime}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-200 pt-2">
                <span className="font-semibold text-zinc-700">
                  Anticipo esperado (50%)
                </span>
                <span className="tabular-nums text-base font-extrabold text-emerald-700">
                  {formatCOP(inspectingBooking.depositAmount)}
                </span>
              </div>
            </div>

            {/* Vista del comprobante adjunto */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {inspectingBooking.receiptUrl &&
              (isLocalPreviewUrl(inspectingBooking.receiptUrl) ||
                inspectingBooking.receiptUrl.startsWith("http")) ? (
                <div className="relative h-64 w-full bg-zinc-100">
                  <Image
                    src={inspectingBooking.receiptUrl}
                    alt={`Comprobante enviado por ${inspectingBooking.customerName}`}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="p-4 text-center space-y-1 bg-zinc-50">
                  <Receipt className="mx-auto h-7 w-7 text-emerald-600" />
                  <p className="text-xs font-bold text-zinc-900">
                    Soporte reportado por el cliente
                  </p>
                  <p className="text-xs text-zinc-600">
                    {inspectingBooking.note ||
                      "Comprobante adjuntado desde el formulario web"}
                  </p>
                </div>
              )}
            </div>

            {inspectingBooking.customerPhone &&
              inspectingBooking.customerPhone !== "En local" && (
                <a
                  href={formatWhatsAppUrl(
                    inspectingBooking.customerPhone,
                    `Hola ${inspectingBooking.customerName.split(" ")[0]}, recibimos tu comprobante para ${tenant.name} a las ${inspectingBooking.startTime}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>Escribir por WhatsApp ({inspectingBooking.customerPhone})</span>
                </a>
              )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onUpdateBookingStatus(inspectingBooking.id, "cancelled");
                  setInspectingBooking(null);
                }}
                className="pressable min-h-[46px] rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                Rechazar turno
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateBookingStatus(inspectingBooking.id, "confirmed");
                  setInspectingBooking(null);
                }}
                className="pressable min-h-[46px] rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Aprobar y confirmar
              </button>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Modal: Cita Rápida (Walk-in) */}
      <ModalDialog
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        title="Registrar cita rápida (Walk-in)"
        subtitle="Bloquea el espacio al instante en tu página pública"
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4">
          <div>
            <label htmlFor="wk-staff" className="block text-sm font-semibold text-zinc-800">
              Barbero
            </label>
            <select
              id="wk-staff"
              value={wkStaffId}
              onChange={(e) => setWkStaffId(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wk-service" className="block text-sm font-semibold text-zinc-800">
              Servicio
            </label>
            <select
              id="wk-service"
              value={wkServiceId}
              onChange={(e) => setWkServiceId(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} ({srv.durationMinutes} min - {formatCOP(srv.basePrice)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="wk-time" className="block text-sm font-semibold text-zinc-800">
                Hora inicio
              </label>
              <input
                id="wk-time"
                type="time"
                required
                value={wkStartTime}
                onChange={(e) => setWkStartTime(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="wk-client" className="block text-sm font-semibold text-zinc-800">
                Nombre cliente
              </label>
              <input
                id="wk-client"
                type="text"
                value={wkCustomerName}
                onChange={(e) => setWkCustomerName(e.target.value)}
                placeholder="Ej. Walk-in"
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              />
            </div>
          </div>

          <button
            type="submit"
            className="pressable min-h-[48px] w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Guardar e iniciar en silla
          </button>
        </form>
      </ModalDialog>

      {/* Modal: Bloqueo Rápido */}
      <ModalDialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title="Bloquear espacio en la agenda"
        subtitle="Evita que reserven por internet mientras descansas o sales"
      >
        <form onSubmit={handleBlockSubmit} className="space-y-4">
          <div>
            <label htmlFor="blk-staff" className="block text-sm font-semibold text-zinc-800">
              Barbero
            </label>
            <select
              id="blk-staff"
              value={blkStaffId}
              onChange={(e) => setBlkStaffId(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="blk-time" className="block text-sm font-semibold text-zinc-800">
                Desde las
              </label>
              <input
                id="blk-time"
                type="time"
                required
                value={blkStartTime}
                onChange={(e) => setBlkStartTime(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              />
            </div>
            <div>
              <label htmlFor="blk-dur" className="block text-sm font-semibold text-zinc-800">
                Duración
              </label>
              <select
                id="blk-dur"
                value={blkDuration}
                onChange={(e) => setBlkDuration(Number(e.target.value))}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="blk-reason" className="block text-sm font-semibold text-zinc-800">
              Motivo del bloqueo
            </label>
            <input
              id="blk-reason"
              type="text"
              value={blkReason}
              onChange={(e) => setBlkReason(e.target.value)}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
            />
          </div>

          <button
            type="submit"
            className="pressable min-h-[48px] w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Bloquear horario
          </button>
        </form>
      </ModalDialog>

      {/* Modal: Configurar Día de Descanso / Cierre del Local (Dueño) */}
      <ModalDialog
        open={restModalOpen}
        onClose={() => setRestModalOpen(false)}
        title={`Descanso · ${selectedDayInfo.labelTop} ${selectedDayInfo.labelDay} ${selectedDayInfo.labelMonth}`}
        subtitle="Nadie podrá reservar por internet en las agendas cerradas"
      >
        <div className="space-y-4">
          {activeCountSelectedDay > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>
                Ya hay <strong>{activeCountSelectedDay} turno(s) activo(s)</strong>{" "}
                este día. Cerrar el día bloquea nuevas reservas sin borrar los turnos ya
                confirmados.
              </p>
            </div>
          )}

          {/* Opción 1: Toda la barbería */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-950">
                Cerrar toda la barbería este día
              </p>
              <p className="text-xs text-zinc-500">
                Ningún barbero recibirá citas el {selectedDayInfo.labelTop}{" "}
                {selectedDayInfo.labelDay} {selectedDayInfo.labelMonth}.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isSelectedShopClosed}
              onClick={() => onToggleShopClosedDate(selectedDate)}
              className={cn(
                "pressable relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                isSelectedShopClosed ? "bg-zinc-950" : "bg-zinc-300"
              )}
            >
              <span className="visually-hidden">Cerrar toda la barbería</span>
              <span
                className={cn(
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform",
                  isSelectedShopClosed ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Opción 2: Descanso individual por barbero */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              O descansa solo un barbero
            </p>
            <div className="space-y-2">
              {staff.map((person) => {
                const isRestDate = Boolean(
                  person.restDates?.includes(selectedDate)
                );
                const disabledByShop = isSelectedShopClosed;
                return (
                  <div
                    key={person.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Image
                        src={person.avatarUrl}
                        alt={person.name}
                        width={32}
                        height={32}
                        unoptimized={isLocalPreviewUrl(person.avatarUrl)}
                        className="h-8 w-8 rounded-full border border-zinc-200 object-cover"
                      />
                      <span className="truncate text-xs font-bold text-zinc-950">
                        {person.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={disabledByShop}
                      onClick={() =>
                        onToggleBarberRestDate(person.id, selectedDate)
                      }
                      className={cn(
                        "pressable min-h-[34px] rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-50",
                        isRestDate || disabledByShop
                          ? "border-amber-300 bg-amber-50 text-amber-900"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      {disabledByShop
                        ? "Local cerrado"
                        : isRestDate
                          ? "En descanso"
                          : "Marcar libre"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRestModalOpen(false)}
            className="pressable min-h-[46px] w-full rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Listo
          </button>
        </div>
      </ModalDialog>
    </div>
  );
}
