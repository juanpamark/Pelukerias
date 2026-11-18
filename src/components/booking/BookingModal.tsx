"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ImagePlus,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { isLocalPreviewUrl } from "@/lib/media";
import {
  calculateAvailableSlots,
  getRestStatusForDate,
  timeStrToMinutes,
} from "@/lib/slot-engine";
import { cn, createTempId, formatCOP } from "@/lib/utils";
import type {
  BookingRecord,
  PublicServiceDTO,
  PublicStaffDTO,
  PublicTenantDTO,
  TimeSlot,
} from "@/types/velociturno";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  tenant: PublicTenantDTO;
  service: PublicServiceDTO | null;
  staffList: PublicStaffDTO[];
  existingBookings: BookingRecord[];
  onBookingCreated: (booking: BookingRecord) => void;
  preselectedStaffId?: string | null;
}

const UPCOMING_DAYS = [
  { date: "2026-11-18", labelTop: "Hoy", labelDay: "18", labelMonth: "Nov" },
  { date: "2026-11-19", labelTop: "Mañana", labelDay: "19", labelMonth: "Nov" },
  { date: "2026-11-20", labelTop: "Vie", labelDay: "20", labelMonth: "Nov" },
  { date: "2026-11-21", labelTop: "Sáb", labelDay: "21", labelMonth: "Nov" },
  { date: "2026-11-22", labelTop: "Dom", labelDay: "22", labelMonth: "Nov" },
  { date: "2026-11-23", labelTop: "Lun", labelDay: "23", labelMonth: "Nov" },
];

function getStaffPrice(service: PublicServiceDTO | null, staffId: string): number {
  if (!service) return 0;
  const override = service.staffOverrides?.find((o) => o.staffId === staffId);
  return override?.price ?? service.basePrice;
}

function getStaffDuration(service: PublicServiceDTO | null, staffId: string): number {
  if (!service) return 30;
  const override = service.staffOverrides?.find((o) => o.staffId === staffId);
  return override?.durationMinutes ?? service.durationMinutes;
}

export function BookingModal({
  open,
  onClose,
  tenant,
  service,
  staffList,
  existingBookings,
  onBookingCreated,
  preselectedStaffId = null,
}: BookingModalProps) {
  const eligibleStaff = useMemo(() => {
    if (!service) return [];
    return staffList.filter(
      (s) => s.isActive && service.assignedStaffIds.includes(s.id)
    );
  }, [service, staffList]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    preselectedStaffId || eligibleStaff[0]?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState<string>(UPCOMING_DAYS[0].date);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null);

  const activeStaff = useMemo(() => {
    return (
      eligibleStaff.find((s) => s.id === selectedStaffId) || eligibleStaff[0] || null
    );
  }, [eligibleStaff, selectedStaffId]);

  const finalPrice = activeStaff
    ? getStaffPrice(service, activeStaff.id)
    : service?.basePrice ?? 0;
  const finalDuration = activeStaff
    ? getStaffDuration(service, activeStaff.id)
    : service?.durationMinutes ?? 30;
  const depositAmount = Math.round(finalPrice * 0.5);
  const balanceAtShop = finalPrice - depositAmount;

  const availableSlots = useMemo(() => {
    if (!activeStaff) return [];
    return calculateAvailableSlots({
      staff: activeStaff,
      date: selectedDate,
      serviceDurationMinutes: finalDuration,
      bookings: existingBookings,
      tenant,
    });
  }, [activeStaff, selectedDate, finalDuration, existingBookings, tenant]);

  const selectedRestStatus = activeStaff
    ? getRestStatusForDate({
        date: selectedDate,
        staff: activeStaff,
        tenant,
      })
    : null;

  // Agrupación en Mañana / Tarde / Noche para cero scroll infinito
  const groupedSlots = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const night: TimeSlot[] = [];

    for (const slot of availableSlots) {
      const mins = timeStrToMinutes(slot.startTime);
      if (mins < 12 * 60) {
        morning.push(slot);
      } else if (mins < 18 * 60) {
        afternoon.push(slot);
      } else {
        night.push(slot);
      }
    }

    return [
      { label: "Mañana", items: morning },
      { label: "Tarde", items: afternoon },
      { label: "Noche", items: night },
    ].filter((g) => g.items.length > 0);
  }, [availableSlots]);

  const nextAvailableDate = useMemo(() => {
    if (availableSlots.length > 0 || !activeStaff) return null;
    for (const day of UPCOMING_DAYS) {
      if (day.date === selectedDate) continue;
      if (
        calculateAvailableSlots({
          staff: activeStaff,
          date: day.date,
          serviceDurationMinutes: finalDuration,
          bookings: existingBookings,
          tenant,
        }).length > 0
      ) {
        return day;
      }
    }
    return null;
  }, [availableSlots.length, activeStaff, selectedDate, finalDuration, existingBookings, tenant]);

  const resetAndClose = () => {
    setStep(1);
    setSelectedStaffId(preselectedStaffId || eligibleStaff[0]?.id || "");
    setSelectedSlot(null);
    setFormError(null);
    setCreatedBooking(null);
    setReceiptName(null);
    setReceiptPreview(null);
    onClose();
  };

  const handleCopyAccount = async (accountNum: string) => {
    try {
      await navigator.clipboard.writeText(accountNum.replace(/\s+/g, ""));
      setCopiedAccount(accountNum);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch {
      setCopiedAccount(accountNum);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setReceiptPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (honeypot.trim().length > 0) {
      return;
    }

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.replace(/\D/g, "");

    if (cleanName.length < 3) {
      setFormError("Ingresa tu nombre completo (mínimo 3 caracteres).");
      return;
    }
    if (cleanPhone.length < 10) {
      setFormError("Ingresa un número de WhatsApp válido de 10 dígitos.");
      return;
    }
    if (tenant.requireDeposit50 && !receiptName) {
      setFormError("Adjunta el pantallazo del comprobante del 50% para confirmar tu turno.");
      return;
    }
    if (!service || !activeStaff || !selectedSlot) return;

    const newBooking: BookingRecord = {
      id: createTempId("bk"),
      tenantSlug: tenant.slug,
      staffId: activeStaff.id,
      serviceId: service.id,
      serviceName: service.name,
      staffName: activeStaff.name,
      customerName: cleanName,
      customerPhone: cleanPhone,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      durationMinutes: finalDuration,
      totalPrice: finalPrice,
      depositRequired: tenant.requireDeposit50,
      depositAmount: tenant.requireDeposit50 ? depositAmount : 0,
      receiptUrl: receiptPreview || undefined,
      status: tenant.requireDeposit50 ? "pending_verification" : "confirmed",
      note: tenant.requireDeposit50
        ? `Comprobante adjunto (${receiptName})`
        : "Reserva confirmada en línea",
    };

    onBookingCreated(newBooking);
    setCreatedBooking(newBooking);
    setStep(4);
  };

  if (!service) return null;

  const modalTitle = step === 4 ? "Turno reservado" : service.name;
  const modalSubtitle =
    step === 4
      ? tenant.name
      : `${finalDuration} min • ${formatCOP(finalPrice)}`;

  return (
    <ModalDialog
      open={open}
      onClose={resetAndClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      maxWidthClass="max-w-xl"
    >
      {/* Progreso pasos 1-3 */}
      {step < 4 && (
        <nav aria-label="Progreso de reserva" className="mb-5">
          <ol className="grid grid-cols-3 gap-2">
            {[
              { id: 1, label: "1. Barbero" },
              { id: 2, label: "2. Horario" },
              { id: 3, label: "3. Confirmar" },
            ].map((item) => {
              const active = step === item.id;
              const done = step > item.id;
              return (
                <li
                  key={item.id}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-center text-xs font-semibold transition-colors",
                    active && "bg-zinc-950 text-white",
                    done && "bg-emerald-50 text-emerald-800",
                    !active && !done && "bg-zinc-100 text-zinc-500"
                  )}
                >
                  {item.label}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* PASO 1: Selección de Barbero (limpio, sin línea verde extra) */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-600">
            Elige el barbero que prefieras para tu servicio:
          </p>

          <div className="space-y-2.5">
            {eligibleStaff.map((person) => {
              const price = getStaffPrice(service, person.id);
              const duration = getStaffDuration(service, person.id);
              const isSelected = activeStaff?.id === person.id;

              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaffId(person.id);
                    setSelectedSlot(null);
                  }}
                  className={cn(
                    "pressable flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left",
                    isSelected
                      ? "border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={person.avatarUrl}
                      alt={`Barbero ${person.name}`}
                      width={48}
                      height={48}
                      unoptimized={isLocalPreviewUrl(person.avatarUrl)}
                      className="h-12 w-12 shrink-0 rounded-full border border-zinc-200 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-950">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{person.role}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="tabular-nums text-sm font-extrabold text-zinc-950">
                      {formatCOP(price)}
                    </p>
                    <p className="text-[11px] text-zinc-500">{duration} min</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="pressable min-h-[48px] w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Continuar a fecha y hora
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Fecha y Hora agrupados en Mañana / Tarde / Noche */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-950">Selecciona el día</p>
              <span className="text-xs text-zinc-500">
                Con {activeStaff?.name}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-6 gap-1.5 sm:gap-2">
              {UPCOMING_DAYS.map((day) => {
                const isSelected = selectedDate === day.date;
                const dayRest = activeStaff
                  ? getRestStatusForDate({
                      date: day.date,
                      staff: activeStaff,
                      tenant,
                    })
                  : null;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.date);
                      setSelectedSlot(null);
                    }}
                    className={cn(
                      "pressable flex flex-col items-center rounded-xl border py-2.5 text-center",
                      isSelected
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : dayRest
                          ? "border-zinc-200 bg-zinc-100/80 text-zinc-400 hover:border-zinc-300"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-medium sm:text-[11px]",
                        isSelected
                          ? "text-zinc-300"
                          : dayRest
                            ? "text-amber-700 font-semibold"
                            : "text-zinc-400"
                      )}
                    >
                      {dayRest === "shop_closed"
                        ? "Cerrado"
                        : dayRest === "barber_rest"
                          ? "Libre"
                          : day.labelTop}
                    </span>
                    <span className="tabular-nums text-base font-bold">
                      {day.labelDay}
                    </span>
                    <span
                      className={cn(
                        "text-[10px]",
                        isSelected ? "text-zinc-300" : "text-zinc-400"
                      )}
                    >
                      {day.labelMonth}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-950">Horarios disponibles</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <Sparkles className="h-3 w-3" />
                Sin tiempos muertos
              </span>
            </div>

            {groupedSlots.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center space-y-3">
                <p className="text-sm font-medium text-zinc-700">
                  {selectedRestStatus === "shop_closed"
                    ? `${tenant.name} no atiende este día (Descanso). Nadie puede agendar en esta fecha.`
                    : selectedRestStatus === "barber_rest"
                      ? `${activeStaff?.name} tiene día de descanso esta fecha. Puedes elegir otro día o cambiar de barbero.`
                      : `No hay turnos libres para este día con ${activeStaff?.name}.`}
                </p>
                {nextAvailableDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(nextAvailableDate.date);
                      setSelectedSlot(null);
                    }}
                    className="pressable inline-flex min-h-[42px] items-center justify-center rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Ir al próximo día disponible ({nextAvailableDate.labelTop}{" "}
                    {nextAvailableDate.labelDay} {nextAvailableDate.labelMonth})
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {groupedSlots.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-400">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {group.items.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              "pressable tabular-nums min-h-[44px] rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
                              isSelected
                                ? "border-zinc-950 bg-zinc-950 text-white"
                                : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
                            )}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="pressable inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="pressable min-h-[48px] flex-1 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Solo 2 datos + Desglose 3 líneas + Nequi/Bre-B + Confirmar mi turno */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs">
            <p className="font-bold text-zinc-950">
              {activeStaff?.name} • {selectedDate} •{" "}
              <span className="tabular-nums">{selectedSlot?.label}</span> ({finalDuration} min)
            </p>
          </div>

          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="hp-website">Sitio web</label>
            <input
              id="hp-website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="customer-name"
              className="block text-sm font-semibold text-zinc-900"
            >
              Nombre completo <span className="text-rose-500">*</span>
            </label>
            <input
              id="customer-name"
              name="customerName"
              type="text"
              required
              autoComplete="name"
              enterKeyHint="next"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Ej. Andrés Felipe Gómez"
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/15"
            />
          </div>

          <div>
            <label
              htmlFor="customer-phone"
              className="block text-sm font-semibold text-zinc-900"
            >
              Número de WhatsApp <span className="text-rose-500">*</span>
            </label>
            <input
              id="customer-phone"
              name="customerPhone"
              type="tel"
              inputMode="numeric"
              required
              autoComplete="tel"
              enterKeyHint="done"
              value={customerPhone}
              onChange={(e) => {
                setCustomerPhone(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Ej. 300 123 4567"
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/15"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Te enviaremos el recordatorio automático a este número.
            </p>
          </div>

          {tenant.requireDeposit50 && (
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="space-y-1.5 border-b border-emerald-200/70 pb-3 text-xs">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Valor del servicio</span>
                  <span className="tabular-nums font-semibold text-zinc-900">
                    {formatCOP(finalPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-emerald-800">
                  <span>Anticipo para reservar hoy (50%)</span>
                  <span className="tabular-nums text-base font-extrabold text-emerald-700">
                    {formatCOP(depositAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Saldo a pagar en la barbería</span>
                  <span className="tabular-nums font-semibold text-zinc-900">
                    {formatCOP(balanceAtShop)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {tenant.paymentAccounts.map((acc) => (
                  <div
                    key={acc.accountNumber}
                    className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-950">
                        {acc.bankName}:{" "}
                        <span className="tabular-nums font-mono text-emerald-700">
                          {acc.accountNumber}
                        </span>
                      </p>
                      <p className="truncate text-[11px] text-zinc-500">
                        Titular: {acc.accountHolder}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount(acc.accountNumber)}
                      className="pressable inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                    >
                      {copiedAccount === acc.accountNumber ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar {acc.bankName.split(" ")[0]}</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label
                  htmlFor="receipt-upload"
                  className="flex min-h-[54px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400 bg-white px-4 py-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 sm:text-sm"
                >
                  <ImagePlus className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="truncate">
                    {receiptName
                      ? `Comprobante adjunto: ${receiptName}`
                      : "Subir pantallazo del comprobante"}
                  </span>
                </label>
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="visually-hidden"
                />
                {receiptPreview && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pantallazo cargado correctamente</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
            >
              {formError}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="pressable inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Atrás</span>
            </button>
            <button
              type="submit"
              className="pressable min-h-[48px] flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Confirmar mi turno
            </button>
          </div>
        </form>
      )}

      {/* PASO 4: Confirmación Final */}
      {step === 4 && createdBooking && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                createdBooking.status === "pending_verification"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {createdBooking.status === "pending_verification"
                ? "Turno separado • Verificando comprobante"
                : "Cita confirmada al instante"}
            </span>
            <h3 className="mt-3 text-xl font-bold text-zinc-950">
              ¡Listo, {createdBooking.customerName.split(" ")[0]}!
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Tu espacio ya quedó separado en{" "}
              <strong className="text-zinc-950">{tenant.name}</strong>.
            </p>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-zinc-500">
                <User className="h-4 w-4" /> Barbero
              </span>
              <span className="font-semibold text-zinc-950">
                {createdBooking.staffName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-zinc-500">
                <Calendar className="h-4 w-4" /> Fecha
              </span>
              <span className="tabular-nums font-semibold text-zinc-950">
                {createdBooking.date}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-zinc-500">
                <Clock className="h-4 w-4" /> Hora
              </span>
              <span className="tabular-nums font-semibold text-zinc-950">
                {selectedSlot?.label} ({createdBooking.durationMinutes} min)
              </span>
            </div>
            {createdBooking.depositRequired && (
              <div className="flex items-center justify-between border-t border-zinc-200 pt-2">
                <span className="text-zinc-500">Saldo a pagar en la barbería</span>
                <span className="tabular-nums font-bold text-zinc-950">
                  {formatCOP(
                    createdBooking.totalPrice - createdBooking.depositAmount
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href={`https://wa.me/57${tenant.whatsappNumberDisplay.replace(/\D/g, "")}?text=${encodeURIComponent(
                `Hola ${tenant.name}, acabo de agendar mi turno para ${createdBooking.serviceName} el ${createdBooking.date} a las ${selectedSlot?.label} con ${createdBooking.staffName}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Enviar por WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={resetAndClose}
              className="pressable min-h-[48px] flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </ModalDialog>
  );
}
