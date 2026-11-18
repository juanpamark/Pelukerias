"use client";

import { useEffect, useId, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Pin,
  PinOff,
  Scissors,
  Settings2,
  Store,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { isLocalPreviewUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { PublicStaffDTO, PublicTenantDTO } from "@/types/velociturno";

export type DashboardTab = "agenda" | "servicios" | "equipo" | "configuracion";

interface DashboardNavDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  tenant: PublicTenantDTO;
  staff: PublicStaffDTO[];
  activeBarberId: string | null;
  pinnedBarberId: string | null;
  onSelectBarberView: (staffId: string | null) => void;
  onTogglePinCurrentBarber: () => void;
  servicesCount: number;
  pendingCount: number;
  copiedSlug: boolean;
  onCopyPublicLink: () => void;
}

export function DashboardNavDrawer({
  open,
  onClose,
  activeTab,
  onSelectTab,
  tenant,
  staff,
  activeBarberId,
  pinnedBarberId,
  onSelectBarberView,
  onTogglePinCurrentBarber,
  servicesCount,
  pendingCount,
  copiedSlug,
  onCopyPublicLink,
}: DashboardNavDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    const handleClick = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        dialog.close();
      }
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleClick);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  const activeBarber = staff.find((s) => s.id === activeBarberId) || null;
  const isCurrentPinned = Boolean(activeBarberId && pinnedBarberId === activeBarberId);

  const navItems: Array<{
    id: DashboardTab;
    label: string;
    icon: typeof CalendarDays;
    badge?: string;
  }> = [
    {
      id: "agenda",
      label: activeBarber ? `Agenda de ${activeBarber.name.split(" ")[0]}` : "Agenda del día",
      icon: CalendarDays,
      badge: pendingCount > 0 ? `${pendingCount}` : undefined,
    },
    {
      id: "servicios",
      label: "Servicios y precios",
      icon: Scissors,
      badge: `${servicesCount}`,
    },
    {
      id: "equipo",
      label: "Perfil y equipo",
      icon: Store,
      badge: `${staff.length}`,
    },
    {
      id: "configuracion",
      label: "Pagos 50% y WhatsApp",
      icon: Settings2,
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 m-0 h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-zinc-950/45 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex h-[100svh] w-full justify-end">
        <nav
          ref={sheetRef}
          aria-label="Menú principal del panel"
          className="flex h-full w-[min(21rem,86vw)] flex-col border-l border-zinc-200 bg-white text-zinc-950 shadow-2xl"
        >
          {/* Cabecera del Drawer */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <div className="min-w-0">
              <p id={titleId} className="truncate text-sm font-bold text-zinc-950">
                {tenant.name}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {activeBarber ? `Sillón de ${activeBarber.name}` : "Vista Dueño • Todos los sillones"}
              </p>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar menú"
              className="pressable -mr-1 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cuerpo desplazable */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Navegación de secciones */}
            <div>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Secciones
              </p>
              <ul className="mt-2 space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => {
                          onSelectTab(item.id);
                          dialogRef.current?.close();
                        }}
                        className={cn(
                          "pressable flex min-h-[46px] w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-zinc-950 text-white"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive ? "text-emerald-400" : "text-zinc-500"
                            )}
                          />
                          <span>{item.label}</span>
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              "tabular-nums rounded-full px-2 py-0.5 text-[11px] font-bold",
                              item.id === "agenda" && pendingCount > 0
                                ? "bg-amber-100 text-amber-800"
                                : isActive
                                  ? "bg-white/15 text-white"
                                  : "bg-zinc-100 text-zinc-600"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Selector rápido de Panel por Barbero (Sin login extra) */}
            <div className="border-t border-zinc-200 pt-5">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Panel por barbero (1 toque)
              </p>
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectBarberView(null);
                    onSelectTab("agenda");
                    dialogRef.current?.close();
                  }}
                  className={cn(
                    "pressable flex min-h-[44px] w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                    activeBarberId === null
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-emerald-700" />
                    <span>Vista Dueño (Todos los sillones)</span>
                  </span>
                  {activeBarberId === null && (
                    <Check className="h-4 w-4 text-emerald-600" />
                  )}
                </button>

                {staff.map((person) => {
                  const selected = activeBarberId === person.id;
                  const pinned = pinnedBarberId === person.id;
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => {
                        onSelectBarberView(person.id);
                        onSelectTab("agenda");
                        dialogRef.current?.close();
                      }}
                      className={cn(
                        "pressable flex min-h-[44px] w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                        selected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Image
                          src={person.avatarUrl}
                          alt={person.name}
                          width={26}
                          height={26}
                          unoptimized={isLocalPreviewUrl(person.avatarUrl)}
                          className="h-6 w-6 shrink-0 rounded-full border border-zinc-200 object-cover"
                        />
                        <span className="truncate">{person.name}</span>
                        {pinned && (
                          <span className="rounded bg-zinc-950 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            Fijado
                          </span>
                        )}
                      </span>
                      {selected ? (
                        <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {activeBarberId && (
                <button
                  type="button"
                  onClick={onTogglePinCurrentBarber}
                  className={cn(
                    "pressable mt-3 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    isCurrentPinned
                      ? "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  )}
                >
                  {isCurrentPinned ? (
                    <>
                      <PinOff className="h-3.5 w-3.5" />
                      <span>Quitar acceso fijo de este celular</span>
                    </>
                  ) : (
                    <>
                      <Pin className="h-3.5 w-3.5" />
                      <span>Abrir siempre en este sillón</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Pie con enlace público */}
          <div className="border-t border-zinc-200 bg-zinc-50 p-4 space-y-2">
            <button
              type="button"
              onClick={onCopyPublicLink}
              className="pressable flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              {copiedSlug ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Enlace copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Copiar velociturno.com/{tenant.slug}</span>
                </>
              )}
            </button>

            <Link
              href={`/${tenant.slug}`}
              onClick={() => dialogRef.current?.close()}
              className="pressable flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-3 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              <span>Ver página pública</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      </div>
    </dialog>
  );
}
