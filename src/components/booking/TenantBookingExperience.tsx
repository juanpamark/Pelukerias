"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  Flame,
  MapPin,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { BookingModal } from "@/components/booking/BookingModal";
import { saveDemoSnapshot, useDemoSnapshot } from "@/lib/demo-store";
import { isLocalPreviewUrl, optimizeMediaUrl } from "@/lib/media";
import { getTodayISO } from "@/lib/mock-data";
import {
  calculateAvailableSlots,
  getRestStatusForDate,
  isShopClosedOnDate,
  type RestReason,
} from "@/lib/slot-engine";
import { cn, formatCOP } from "@/lib/utils";
import type {
  BookingRecord,
  PublicServiceDTO,
  PublicStaffDTO,
  PublicTenantDTO,
  ServiceCategory,
} from "@/types/velociturno";

interface TenantBookingExperienceProps {
  tenant: PublicTenantDTO;
  staff: PublicStaffDTO[];
  services: PublicServiceDTO[];
  initialBookings: BookingRecord[];
}

const CATEGORIES: Array<"Todos" | ServiceCategory> = [
  "Todos",
  "Cortes",
  "Combos",
  "Barba",
  "Cejas",
];

export function TenantBookingExperience({
  tenant: initialTenant,
  staff: initialStaff,
  services: initialServices,
  initialBookings,
}: TenantBookingExperienceProps) {
  const [selectedCategory, setSelectedCategory] = useState<"Todos" | ServiceCategory>("Todos");
  const fallbackSnapshot = useMemo(
    () => ({
      tenant: initialTenant,
      staff: initialStaff,
      services: initialServices,
      bookings: initialBookings,
    }),
    [initialTenant, initialStaff, initialServices, initialBookings]
  );
  const { tenant, staff, services, bookings } = useDemoSnapshot(
    initialTenant.slug,
    fallbackSnapshot
  );
  const [activeService, setActiveService] = useState<PublicServiceDTO | null>(null);
  const [preselectedStaffId, setPreselectedStaffId] = useState<string | null>(null);

  const todayISO = getTodayISO();
  const baseService = services[0];
  const isShopClosedToday = isShopClosedOnDate(todayISO, tenant);

  const filteredServices = useMemo(() => {
    const active = services.filter((s) => s.isActive);
    if (selectedCategory === "Todos") return active;
    return active.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Calcular tarifa base, estado de descanso y próximo turno real hoy por cada barbero
  const staffMetaMap = useMemo(() => {
    const map = new Map<
      string,
      { baseCutPrice: number; nextSlotLabel: string | null; restReason: RestReason }
    >();
    for (const person of staff) {
      const override = baseService?.staffOverrides?.find((o) => o.staffId === person.id);
      const baseCutPrice = override?.price ?? baseService?.basePrice ?? 35000;
      const duration = override?.durationMinutes ?? baseService?.durationMinutes ?? 45;
      const restReason = getRestStatusForDate({
        date: todayISO,
        staff: person,
        tenant,
      });
      const slots = calculateAvailableSlots({
        staff: person,
        date: todayISO,
        serviceDurationMinutes: duration,
        bookings,
        tenant,
      });
      map.set(person.id, {
        baseCutPrice,
        nextSlotLabel: slots[0]?.label ?? null,
        restReason,
      });
    }
    return map;
  }, [staff, baseService, todayISO, bookings, tenant]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${tenant.name}, ${tenant.address}, ${tenant.city}`
  )}`;

  const handleOpenBooking = (
    service: PublicServiceDTO,
    staffId: string | null = null
  ) => {
    setPreselectedStaffId(staffId);
    setActiveService(service);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      {/* Barra discreta de Vista Previa Demo */}
      <div className="border-b border-zinc-200 bg-zinc-100/90">
        <div className="mx-auto flex min-h-[42px] max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Velociturno</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="hidden sm:inline">Vista previa de cliente</span>
            <span className="hidden text-zinc-300 sm:inline">•</span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-950"
            >
              <span>Ir al Panel de Dueño</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Banner de la Barbería (sin solapamiento de texto sobre la foto) */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="relative h-44 w-full overflow-hidden sm:h-60 sm:rounded-b-3xl">
            <Image
              src={optimizeMediaUrl(tenant.bannerUrl)}
              alt={`Interior y estaciones de trabajo de ${tenant.name}`}
              fill
              priority
              unoptimized={isLocalPreviewUrl(tenant.bannerUrl)}
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/45 via-transparent to-transparent" />
          </div>

          <div className="px-4 pb-6 sm:px-6 sm:pb-7">
            {/* Avatar flotante + bloque de título limpio debajo de la portada */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative z-10 -mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-zinc-950 text-2xl font-extrabold text-white shadow-md sm:-mt-12 sm:h-24 sm:w-24">
                  {tenant.logoInitials}
                </div>

                <div className="pt-2.5 sm:pt-3">
                  <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
                    {tenant.name}
                  </h1>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 sm:text-sm"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="underline decoration-zinc-300 underline-offset-2">
                      {tenant.address} • {tenant.district}
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-zinc-400" />
                  </a>
                </div>
              </div>

              {/* Calificación y Horario de Cierre */}
              <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-3">
                {tenant.reviewCount > 0 ? (
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-950">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="tabular-nums">{tenant.rating.toFixed(1)}</span>
                    <span className="font-normal text-zinc-500">
                      ({tenant.reviewCount.toLocaleString("es-CO")})
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700">
                    Nuevo en Velociturno
                  </span>
                )}

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold",
                    tenant.isOpenNow && !isShopClosedToday
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-zinc-200 bg-zinc-100 text-zinc-600"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      tenant.isOpenNow && !isShopClosedToday
                        ? "bg-emerald-500"
                        : "bg-zinc-400"
                    )}
                  />
                  {isShopClosedToday
                    ? "Cerrado hoy • Día de descanso"
                    : tenant.isOpenNow
                      ? "Abierto hoy • Hasta las 8:00 p. m."
                      : "Cerrado hoy"}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              {tenant.tagline}
            </p>

            {tenant.requireDeposit50 && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs font-medium text-emerald-950 sm:items-center">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 sm:mt-0" />
                <span>
                  Asegura tu cupo en 30 segundos: separa tu turno con el{" "}
                  <strong>50% por Nequi o Llave Bre-B</strong> y paga el resto al terminar tu
                  corte.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catálogo de Servicios */}
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
        <section aria-labelledby="servicios-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="servicios-heading" className="text-xl font-bold tracking-tight text-zinc-950">
              Menú de servicios
            </h2>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "pressable shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-zinc-950 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3.5">
            {filteredServices.map((srv) => {
              const hasLevels = Boolean(srv.staffOverrides && srv.staffOverrides.length > 0);
              return (
                <article
                  key={srv.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-950">{srv.name}</h3>
                      {srv.isPopular && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          <Flame className="h-3 w-3 text-amber-600" />
                          Más pedido
                        </span>
                      )}
                    </div>
                    <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
                      {srv.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs font-medium text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        {srv.durationMinutes} min
                      </span>
                      <span className="tabular-nums text-sm font-bold text-zinc-950">
                        {hasLevels
                          ? `Desde ${formatCOP(srv.basePrice)} según nivel del barbero`
                          : formatCOP(srv.basePrice)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBooking(srv)}
                    className="pressable min-h-[44px] shrink-0 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Reservar
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* Equipo de Barberos */}
        <section aria-labelledby="equipo-heading">
          <div>
            <h2 id="equipo-heading" className="text-xl font-bold tracking-tight text-zinc-950">
              Nuestro equipo
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Elige a tu barbero de confianza o selecciona el próximo turno disponible hoy.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {staff
              .filter((s) => s.isActive)
              .map((person) => {
                const meta = staffMetaMap.get(person.id);
                return (
                  <div
                    key={person.id}
                    className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <Image
                          src={person.avatarUrl}
                          alt={`Fotografía de ${person.name}, ${person.role}`}
                          width={56}
                          height={56}
                          unoptimized={isLocalPreviewUrl(person.avatarUrl)}
                          className="h-14 w-14 rounded-full border border-zinc-200 object-cover"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-zinc-950">
                            {person.name}
                          </h3>
                          <p className="truncate text-xs font-medium text-zinc-500">
                            {person.role}
                          </p>
                          {person.reviewCount > 0 && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zinc-800">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="tabular-nums">{person.rating.toFixed(1)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tarifa base + Disponibilidad real */}
                      <div className="mt-3.5 space-y-2 border-t border-zinc-100 pt-3">
                        <p className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Corte desde</span>
                          <span className="tabular-nums font-bold text-zinc-950">
                            {formatCOP(meta?.baseCutPrice ?? 35000)}
                          </span>
                        </p>

                        {meta?.nextSlotLabel ? (
                          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Disponible hoy · {meta.nextSlotLabel}
                          </span>
                        ) : meta?.restReason ? (
                          <span className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600">
                            Hoy en descanso • Ver otros días
                          </span>
                        ) : (
                          <span className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium text-zinc-500">
                            Sin turnos hoy • Ver mañana
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenBooking(baseService, person.id)}
                      className="pressable mt-4 min-h-[42px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                    >
                      Ver disponibilidad
                    </button>
                  </div>
                );
              })}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
        <span className="inline-flex flex-wrap items-center justify-center gap-1.5 px-4">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>
            Agenda verificada por <strong className="text-zinc-900">Velociturno</strong> •
            Confirmación inmediata por WhatsApp
          </span>
        </span>
      </footer>

      <BookingModal
        key={`${activeService?.id || "none"}-${preselectedStaffId || "first"}`}
        open={Boolean(activeService)}
        onClose={() => setActiveService(null)}
        tenant={tenant}
        service={activeService}
        staffList={staff}
        existingBookings={bookings}
        preselectedStaffId={preselectedStaffId}
        onBookingCreated={(newBooking) => {
          saveDemoSnapshot(tenant.slug, {
            tenant,
            staff,
            services,
            bookings: [...bookings, newBooking],
          });
        }}
      />
    </div>
  );
}
