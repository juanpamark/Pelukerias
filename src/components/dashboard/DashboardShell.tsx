"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Menu,
  Pin,
  Scissors,
  Settings2,
  Store,
  Undo2,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  DashboardNavDrawer,
  type DashboardTab,
} from "@/components/dashboard/DashboardNavDrawer";
import { ProfileAndTeamManager } from "@/components/dashboard/ProfileAndTeamManager";
import { ScheduleBoard } from "@/components/dashboard/ScheduleBoard";
import { ServicesManager } from "@/components/dashboard/ServicesManager";
import { WhatsAppAndPaymentsPanel } from "@/components/dashboard/WhatsAppAndPaymentsPanel";
import {
  clearDemoSnapshot,
  saveDemoSnapshot,
  savePinnedBarberId,
  useDemoSnapshot,
  usePinnedBarberId,
} from "@/lib/demo-store";
import { isLocalPreviewUrl } from "@/lib/media";
import { getTodayISO } from "@/lib/mock-data";
import { cn, formatCOP } from "@/lib/utils";
import type {
  BookingRecord,
  BookingStatus,
  PublicServiceDTO,
  PublicStaffDTO,
  PublicTenantDTO,
} from "@/types/velociturno";

interface DashboardShellProps {
  initialTenant: PublicTenantDTO;
  initialStaff: PublicStaffDTO[];
  initialServices: PublicServiceDTO[];
  initialBookings: BookingRecord[];
}

interface UndoNotification {
  bookingId: string;
  customerName: string;
  previousStatus: BookingStatus;
  label: string;
}

export function DashboardShell({
  initialTenant,
  initialStaff,
  initialServices,
  initialBookings,
}: DashboardShellProps) {
  const searchParams = useSearchParams();
  const barberoParam = searchParams.get("barbero");

  const [activeTab, setActiveTab] = useState<DashboardTab>("agenda");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fallbackSnapshot = useMemo(
    () => ({
      tenant: initialTenant,
      staff: initialStaff,
      services: initialServices,
      bookings: initialBookings,
    }),
    [initialTenant, initialStaff, initialServices, initialBookings]
  );

  const snapshot = useDemoSnapshot(initialTenant.slug, fallbackSnapshot);
  const { tenant, staff, services, bookings } = snapshot;

  const storedPinnedBarberId = usePinnedBarberId(initialTenant.slug);
  const pinnedBarberId =
    storedPinnedBarberId && staff.some((s) => s.id === storedPinnedBarberId)
      ? storedPinnedBarberId
      : null;

  const todayDate = getTodayISO();
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [onlyPendingFilter, setOnlyPendingFilter] = useState(false);
  const [demoVersion, setDemoVersion] = useState(0);

  // Vista activa: undefined = usar query ?barbero o preferencia fijada en este dispositivo
  const [manualBarberId, setManualBarberId] = useState<string | null | undefined>(
    undefined
  );
  const [copiedSlug, setCopiedSlug] = useState(false);

  const [undoToast, setUndoToast] = useState<UndoNotification | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const barberoFromQuery = useMemo(() => {
    if (barberoParam === "dueno") return null;
    if (barberoParam && staff.some((s) => s.id === barberoParam)) {
      return barberoParam;
    }
    return undefined;
  }, [barberoParam, staff]);

  const activeBarberId =
    manualBarberId !== undefined
      ? manualBarberId
      : barberoFromQuery !== undefined
        ? barberoFromQuery
        : pinnedBarberId;

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const commitSnapshot = (
    updater: (current: typeof snapshot) => typeof snapshot
  ) => {
    saveDemoSnapshot(tenant.slug, updater(snapshot));
  };

  const activeBarber = useMemo(
    () => (activeBarberId ? staff.find((s) => s.id === activeBarberId) || null : null),
    [activeBarberId, staff]
  );

  const metrics = useMemo(() => {
    const dayActive = bookings.filter(
      (b) =>
        b.date === selectedDate &&
        (!activeBarberId || b.staffId === activeBarberId) &&
        b.status !== "cancelled" &&
        b.status !== "no_show" &&
        b.status !== "blocked"
    );
    const estimatedRevenue = dayActive.reduce((sum, b) => sum + b.totalPrice, 0);
    const pendingVerify = dayActive.filter(
      (b) => b.status === "pending_verification"
    ).length;

    return {
      totalDay: dayActive.length,
      estimatedRevenue,
      pendingVerify,
    };
  }, [bookings, selectedDate, activeBarberId]);

  const handleUpdateBookingStatus = (id: string, status: BookingStatus) => {
    const target = bookings.find((b) => b.id === id);
    if (!target) return;

    const previousStatus = target.status;
    commitSnapshot((curr) => ({
      ...curr,
      bookings: curr.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }));

    if (status === "cancelled" || status === "no_show") {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoToast({
        bookingId: id,
        customerName:
          target.serviceId === "block" ? target.serviceName : target.customerName,
        previousStatus,
        label: status === "no_show" ? "marcado como No asistió" : "cancelado",
      });
      undoTimerRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 6500);
    } else if (undoToast?.bookingId === id) {
      setUndoToast(null);
    }
  };

  const handleUndoStatus = () => {
    if (!undoToast) return;
    const { bookingId, previousStatus } = undoToast;
    commitSnapshot((curr) => ({
      ...curr,
      bookings: curr.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: previousStatus } : b
      ),
    }));
    setUndoToast(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const handleAddBooking = (booking: BookingRecord) => {
    commitSnapshot((curr) => ({
      ...curr,
      bookings: [...curr.bookings, booking],
    }));
  };

  const handleSaveService = (service: PublicServiceDTO) => {
    commitSnapshot((curr) => {
      const exists = curr.services.some((s) => s.id === service.id);
      return {
        ...curr,
        services: exists
          ? curr.services.map((s) => (s.id === service.id ? service : s))
          : [...curr.services, service],
      };
    });
  };

  const handleToggleServiceActive = (serviceId: string) => {
    commitSnapshot((curr) => ({
      ...curr,
      services: curr.services.map((s) =>
        s.id === serviceId ? { ...s, isActive: !s.isActive } : s
      ),
    }));
  };

  const handleUpdateStaffMember = (updated: PublicStaffDTO) => {
    commitSnapshot((curr) => ({
      ...curr,
      staff: curr.staff.map((s) => (s.id === updated.id ? updated : s)),
      bookings: curr.bookings.map((b) =>
        b.staffId === updated.id ? { ...b, staffName: updated.name } : b
      ),
    }));
  };

  const handleAddStaffMember = (
    member: PublicStaffDTO,
    assignAllServices: boolean
  ) => {
    commitSnapshot((curr) => ({
      ...curr,
      staff: [...curr.staff, member],
      services: assignAllServices
        ? curr.services.map((srv) => ({
            ...srv,
            assignedStaffIds: srv.assignedStaffIds.includes(member.id)
              ? srv.assignedStaffIds
              : [...srv.assignedStaffIds, member.id],
          }))
        : curr.services,
    }));
  };

  const handleRemoveStaffMember = (staffId: string) => {
    commitSnapshot((curr) => ({
      ...curr,
      staff: curr.staff.filter((s) => s.id !== staffId),
      services: curr.services.map((srv) => ({
        ...srv,
        assignedStaffIds: srv.assignedStaffIds.filter((id) => id !== staffId),
      })),
    }));
    if (activeBarberId === staffId) {
      setManualBarberId(null);
    }
    if (pinnedBarberId === staffId) {
      savePinnedBarberId(tenant.slug, null);
    }
  };

  const handleTogglePinCurrentBarber = () => {
    if (!activeBarberId) return;
    if (pinnedBarberId === activeBarberId) {
      savePinnedBarberId(tenant.slug, null);
    } else {
      savePinnedBarberId(tenant.slug, activeBarberId);
    }
  };

  const handleToggleShopClosedDate = (date: string) => {
    commitSnapshot((curr) => {
      const currentClosed = curr.tenant.closedDates || [];
      const exists = currentClosed.includes(date);
      const nextClosed = exists
        ? currentClosed.filter((d) => d !== date)
        : [...currentClosed, date];
      return {
        ...curr,
        tenant: { ...curr.tenant, closedDates: nextClosed },
      };
    });
  };

  const handleToggleBarberRestDate = (staffId: string, date: string) => {
    commitSnapshot((curr) => ({
      ...curr,
      staff: curr.staff.map((person) => {
        if (person.id !== staffId) return person;
        const currentRest = person.restDates || [];
        const exists = currentRest.includes(date);
        return {
          ...person,
          restDates: exists
            ? currentRest.filter((d) => d !== date)
            : [...currentRest, date],
        };
      }),
    }));
  };

  const handleResetDemoData = () => {
    clearDemoSnapshot(initialTenant.slug);
    savePinnedBarberId(initialTenant.slug, null);
    setManualBarberId(null);
    setOnlyPendingFilter(false);
    setSelectedDate(getTodayISO());
    setDemoVersion((v) => v + 1);
  };

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://velociturno.com/${tenant.slug}`);
    } catch {
      // Fallback
    }
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const navItems: Array<{
    id: DashboardTab;
    label: string;
    icon: typeof CalendarDays;
    badge?: number;
  }> = [
    {
      id: "agenda",
      label: activeBarber ? `Agenda (${activeBarber.name.split(" ")[0]})` : "Agenda",
      icon: CalendarDays,
      badge: metrics.pendingVerify > 0 ? metrics.pendingVerify : undefined,
    },
    { id: "servicios", label: "Servicios", icon: Scissors },
    { id: "equipo", label: "Perfil y equipo", icon: Store },
    { id: "configuracion", label: "Pagos y WhatsApp", icon: Settings2 },
  ];

  const isCurrentPinned = Boolean(
    activeBarberId && pinnedBarberId === activeBarberId
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      {/* Cabecera única compacta (sin doble fila apilada) */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo href="/" size="sm" />
            <span className="hidden h-5 w-px bg-zinc-200 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-950">
                {tenant.name}
              </p>
              <p className="truncate text-[11px] text-zinc-500">
                {activeBarber
                  ? `Panel de ${activeBarber.name}`
                  : "Panel de administración"}
              </p>
            </div>
          </div>

          {/* Navegación inline solo en escritorio (lg+) */}
          <nav
            aria-label="Secciones del panel"
            className="hidden items-center gap-1 lg:flex"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "pressable inline-flex min-h-[38px] items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      active ? "text-emerald-400" : "text-zinc-400"
                    )}
                  />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="tabular-nums rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Controles derechos */}
          <div className="flex items-center gap-2">
            {/* Selector rápido de Sillón en Desktop/Tablet */}
            <div className="hidden md:block">
              <label htmlFor="desktop-view-switch" className="visually-hidden">
                Cambiar vista de panel
              </label>
              <select
                id="desktop-view-switch"
                value={activeBarberId || "owner"}
                onChange={(e) => {
                  const val = e.target.value;
                  setManualBarberId(val === "owner" ? null : val);
                  setActiveTab("agenda");
                  setOnlyPendingFilter(false);
                }}
                className="min-h-[38px] rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-semibold text-zinc-800 hover:border-zinc-300 focus:border-zinc-950 focus:outline-none"
              >
                <option value="owner">Vista Dueño (Todos)</option>
                {staff.map((person) => (
                  <option key={person.id} value={person.id}>
                    Sillón: {person.name.split(" ")[0]}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="pressable hidden min-h-[38px] items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 xl:inline-flex"
            >
              {copiedSlug ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>/{tenant.slug}</span>
                </>
              )}
            </button>

            <Link
              href={`/${tenant.slug}`}
              className="pressable hidden min-h-[38px] items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 text-xs font-semibold text-white hover:bg-zinc-800 sm:inline-flex"
            >
              <span>Ver página</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            {/* Botón Hamburguesa (Móvil y Tablet < lg) */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú del panel"
              aria-expanded={drawerOpen}
              className="pressable relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
              {metrics.pendingVerify > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* Barra contextual cuando está activo el Panel Personal de un Barbero */}
        {activeBarber && (
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={activeBarber.avatarUrl}
                alt={activeBarber.name}
                width={38}
                height={38}
                unoptimized={isLocalPreviewUrl(activeBarber.avatarUrl)}
                className="h-9 w-9 shrink-0 rounded-full border border-emerald-200 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-zinc-950 sm:text-sm">
                  Panel directo de {activeBarber.name}
                </p>
                <p className="text-[11px] text-emerald-900">
                  {isCurrentPinned
                    ? "Fijado en este celular: al abrir el panel entras directo aquí."
                    : "Mostrando solo tus citas y movimientos sin filtros extra."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePinCurrentBarber}
                className={cn(
                  "pressable inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors",
                  isCurrentPinned
                    ? "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
                    : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                {isCurrentPinned ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Fijado en celular</span>
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5" />
                    <span>Fijar en este celular</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setManualBarberId(null)}
                className="pressable inline-flex min-h-[36px] items-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Ver toda la barbería
              </button>
            </div>
          </div>
        )}

        {/* Métricas operativas limpias (sincronizadas con día y vista) */}
        <section
          aria-label="Resumen operativo"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">
              {activeBarber ? "Mis turnos activos" : "Turnos activos"}
            </p>
            <p className="tabular-nums mt-1 text-2xl font-extrabold text-zinc-950">
              {metrics.totalDay}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">
              {activeBarber ? "Mi producción estimada" : "Ingreso proyectado"}
            </p>
            <p className="tabular-nums mt-1 text-2xl font-extrabold text-zinc-950">
              {formatCOP(metrics.estimatedRevenue)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab("agenda");
              if (metrics.pendingVerify > 0) {
                setOnlyPendingFilter((prev) => !prev);
              }
            }}
            className={cn(
              "pressable col-span-2 rounded-2xl border bg-white p-4 text-left transition-colors sm:col-span-1",
              onlyPendingFilter
                ? "border-amber-500 ring-1 ring-amber-500"
                : "border-zinc-200 hover:border-zinc-300"
            )}
          >
            <p className="text-xs font-medium text-zinc-500">
              Comprobantes 50% por aprobar
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p
                className={cn(
                  "tabular-nums text-2xl font-extrabold",
                  metrics.pendingVerify > 0 ? "text-amber-600" : "text-emerald-600"
                )}
              >
                {metrics.pendingVerify}
              </p>
              {metrics.pendingVerify > 0 && (
                <span className="text-[11px] font-semibold text-amber-700">
                  {onlyPendingFilter ? "Ver todos" : "Filtrar →"}
                </span>
              )}
            </div>
          </button>
        </section>

        {/* Contenido dinámico según sección activa */}
        {activeTab === "agenda" && (
          <ScheduleBoard
            tenant={tenant}
            bookings={bookings}
            staff={staff}
            services={services}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            activeBarberId={activeBarberId}
            onlyPendingFilter={onlyPendingFilter}
            onTogglePendingFilter={() => setOnlyPendingFilter((prev) => !prev)}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onAddBooking={handleAddBooking}
            onToggleShopClosedDate={handleToggleShopClosedDate}
            onToggleBarberRestDate={handleToggleBarberRestDate}
          />
        )}

        {activeTab === "servicios" && (
          <ServicesManager
            services={services}
            staff={staff}
            onSaveService={handleSaveService}
            onToggleServiceActive={handleToggleServiceActive}
          />
        )}

        {activeTab === "equipo" && (
          <ProfileAndTeamManager
            key={demoVersion}
            tenant={tenant}
            staff={staff}
            onUpdateTenant={(updatedTenant) =>
              commitSnapshot((curr) => ({ ...curr, tenant: updatedTenant }))
            }
            onUpdateStaffMember={handleUpdateStaffMember}
            onAddStaffMember={handleAddStaffMember}
            onRemoveStaffMember={handleRemoveStaffMember}
            onOpenBarberView={(staffId) => {
              setManualBarberId(staffId);
              setActiveTab("agenda");
              setOnlyPendingFilter(false);
            }}
            onResetDemoData={handleResetDemoData}
          />
        )}

        {activeTab === "configuracion" && (
          <WhatsAppAndPaymentsPanel
            tenant={tenant}
            onToggleDeposit50={() =>
              commitSnapshot((curr) => ({
                ...curr,
                tenant: {
                  ...curr.tenant,
                  requireDeposit50: !curr.tenant.requireDeposit50,
                },
              }))
            }
            onUpdateAccount={(index, accountNumber, accountHolder) => {
              commitSnapshot((curr) => {
                const updated = [...curr.tenant.paymentAccounts];
                updated[index] = {
                  ...updated[index],
                  accountNumber,
                  accountHolder,
                };
                return {
                  ...curr,
                  tenant: { ...curr.tenant, paymentAccounts: updated },
                };
              });
            }}
          />
        )}
      </main>

      {/* Toast temporal de Deshacer cancelación accidental / No asistió */}
      {undoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-white shadow-xl"
        >
          <p className="min-w-0 truncate">
            Turno de <strong className="font-bold">{undoToast.customerName}</strong>{" "}
            {undoToast.label}.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleUndoStatus}
              className="pressable inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-zinc-950 hover:bg-emerald-400"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Deshacer</span>
            </button>
            <button
              type="button"
              onClick={() => setUndoToast(null)}
              aria-label="Cerrar aviso"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drawer Móvil Hamburguesa */}
      <DashboardNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tenant={tenant}
        staff={staff}
        activeBarberId={activeBarberId}
        pinnedBarberId={pinnedBarberId}
        onSelectBarberView={(id) => {
          setManualBarberId(id);
          setOnlyPendingFilter(false);
        }}
        onTogglePinCurrentBarber={handleTogglePinCurrentBarber}
        servicesCount={services.length}
        pendingCount={metrics.pendingVerify}
        copiedSlug={copiedSlug}
        onCopyPublicLink={handleCopyPublicLink}
      />
    </div>
  );
}
