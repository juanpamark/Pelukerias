"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Camera,
  Check,
  Clock,
  Copy,
  ExternalLink,
  ImagePlus,
  Plus,
  RotateCcw,
  Store,
  Trash2,
  UserPlus,
} from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import {
  compressImageFileToDataUrl,
  isLocalPreviewUrl,
  optimizeMediaUrl,
} from "@/lib/media";
import { DEFAULT_TENANT } from "@/lib/mock-data";
import { WEEKDAY_OPTIONS } from "@/lib/slot-engine";
import { cn, createTempId, formatCOP } from "@/lib/utils";
import type { PublicStaffDTO, PublicTenantDTO } from "@/types/velociturno";

const BASE_INCLUDED_BARBERS = 3;
const EXTRA_BARBER_COST_COP = 6000;

const DEFAULT_AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80";

interface ProfileAndTeamManagerProps {
  tenant: PublicTenantDTO;
  staff: PublicStaffDTO[];
  onUpdateTenant: (updated: PublicTenantDTO) => void;
  onUpdateStaffMember: (updated: PublicStaffDTO) => void;
  onAddStaffMember: (member: PublicStaffDTO, assignAllServices: boolean) => void;
  onRemoveStaffMember: (staffId: string) => void;
  onOpenBarberView: (staffId: string) => void;
  onResetDemoData: () => void;
}

export function ProfileAndTeamManager({
  tenant,
  staff,
  onUpdateTenant,
  onUpdateStaffMember,
  onAddStaffMember,
  onRemoveStaffMember,
  onOpenBarberView,
  onResetDemoData,
}: ProfileAndTeamManagerProps) {
  // Estado formulario perfil del local
  const [shopName, setShopName] = useState(tenant.name);
  const [shopInitials, setShopInitials] = useState(tenant.logoInitials);
  const [shopTagline, setShopTagline] = useState(tenant.tagline);
  const [shopAddress, setShopAddress] = useState(tenant.address);
  const [shopHours, setShopHours] = useState(tenant.openHoursLabel);
  const [shopClosedWeekdays, setShopClosedWeekdays] = useState<number[]>(
    tenant.closedWeekdays || []
  );
  const [shopSaved, setShopSaved] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Estado edición individual de barbero
  const [editingBarber, setEditingBarber] = useState<PublicStaffDTO | null>(null);
  const [editName, setEditName] = useState("");
  const [editWorkStart, setEditWorkStart] = useState("09:00");
  const [editWorkEnd, setEditWorkEnd] = useState("20:00");
  const [editBreakStart, setEditBreakStart] = useState("13:00");
  const [editBreakEnd, setEditBreakEnd] = useState("14:00");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editRestWeekdays, setEditRestWeekdays] = useState<number[]>([]);

  // Estado modal agregar barbero (+$6.000/mes)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWorkStart, setNewWorkStart] = useState("09:00");
  const [newWorkEnd, setNewWorkEnd] = useState("20:00");
  const [newBreakStart, setNewBreakStart] = useState("13:00");
  const [newBreakEnd, setNewBreakEnd] = useState("14:00");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [newRestWeekdays, setNewRestWeekdays] = useState<number[]>([]);
  const [assignAllServices, setAssignAllServices] = useState(true);

  const [copiedBarberId, setCopiedBarberId] = useState<string | null>(null);
  const [uploadingStaffId, setUploadingStaffId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const extraBarbersCount = Math.max(0, staff.length - BASE_INCLUDED_BARBERS);
  const extraMonthlyTotal = extraBarbersCount * EXTRA_BARBER_COST_COP;
  const willChargeExtraOnNextAdd = staff.length >= BASE_INCLUDED_BARBERS;

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingBanner(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 1280);
      onUpdateTenant({ ...tenant, bannerUrl: dataUrl });
    } catch {
      setUploadError("No se pudo cargar la foto del local. Intenta con JPG o PNG.");
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleDirectBarberAvatarUpload = async (
    person: PublicStaffDTO,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingStaffId(person.id);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 480);
      onUpdateStaffMember({ ...person, avatarUrl: dataUrl });
      if (editingBarber?.id === person.id) {
        setEditAvatarUrl(dataUrl);
      }
    } catch {
      setUploadError("No se pudo cargar la foto del barbero.");
    } finally {
      setUploadingStaffId(null);
      e.target.value = "";
    }
  };

  const handleNewBarberAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 480);
      setNewAvatarUrl(dataUrl);
    } catch {
      setUploadError("No se pudo procesar la foto seleccionada.");
    } finally {
      e.target.value = "";
    }
  };

  const toggleWeekdayInList = (list: number[], day: number): number[] =>
    list.includes(day) ? list.filter((d) => d !== day) : [...list, day];

  const handleSaveShopProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = shopName.trim() || tenant.name;
    const cleanInitials =
      shopInitials.trim().toUpperCase().slice(0, 3) || tenant.logoInitials;
    onUpdateTenant({
      ...tenant,
      name: cleanName,
      logoInitials: cleanInitials,
      tagline: shopTagline.trim() || tenant.tagline,
      address: shopAddress.trim() || tenant.address,
      openHoursLabel: shopHours.trim() || tenant.openHoursLabel,
      closedWeekdays: shopClosedWeekdays,
    });
    setShopSaved(true);
    setTimeout(() => setShopSaved(false), 2200);
  };

  const openEditBarber = (person: PublicStaffDTO) => {
    setEditingBarber(person);
    setEditName(person.name);
    setEditWorkStart(person.workStart);
    setEditWorkEnd(person.workEnd);
    setEditBreakStart(person.breakStart || "13:00");
    setEditBreakEnd(person.breakEnd || "14:00");
    setEditAvatarUrl(person.avatarUrl);
    setEditRestWeekdays(person.restWeekdays || []);
  };

  const handleSaveEditedBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber || !editName.trim()) return;
    onUpdateStaffMember({
      ...editingBarber,
      name: editName.trim(),
      workStart: editWorkStart,
      workEnd: editWorkEnd,
      breakStart: editBreakStart || undefined,
      breakEnd: editBreakEnd || undefined,
      avatarUrl: editAvatarUrl || editingBarber.avatarUrl,
      restWeekdays: editRestWeekdays,
    });
    setEditingBarber(null);
  };

  const handleCreateNewBarber = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    const newStaff: PublicStaffDTO = {
      id: createTempId("staff"),
      name: trimmed,
      role: "Barbero Profesional",
      avatarUrl: newAvatarUrl || DEFAULT_AVATAR_FALLBACK,
      rating: 0,
      reviewCount: 0,
      workStart: newWorkStart,
      workEnd: newWorkEnd,
      breakStart: newBreakStart || undefined,
      breakEnd: newBreakEnd || undefined,
      isActive: true,
      restWeekdays: newRestWeekdays,
      restDates: [],
    };

    onAddStaffMember(newStaff, assignAllServices);
    setNewName("");
    setNewAvatarUrl("");
    setNewRestWeekdays([]);
    setAssignAllServices(true);
    setAddModalOpen(false);
  };

  const handleCopyBarberLink = async (person: PublicStaffDTO) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://velociturno.com";
    const directUrl = `${origin}/dashboard?barbero=${encodeURIComponent(person.id)}`;
    try {
      await navigator.clipboard.writeText(directUrl);
    } catch {
      // Fallback silencioso
    }
    setCopiedBarberId(person.id);
    setTimeout(() => setCopiedBarberId(null), 2200);
  };

  return (
    <div className="space-y-8">
      {uploadError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800"
        >
          {uploadError}
        </div>
      )}

      {/* BLOQUE 1: Perfil e Imagen de la Barbería */}
      <section
        aria-labelledby="perfil-local-heading"
        className="rounded-2xl border border-zinc-200 bg-white overflow-hidden"
      >
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 id="perfil-local-heading" className="text-lg font-bold text-zinc-950">
                Perfil de tu barbería
              </h2>
              <p className="text-xs text-zinc-500">
                Personaliza la foto del lugar y los datos que ven tus clientes al reservar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetDemoData}
            className="pressable inline-flex min-h-[38px] items-center gap-1.5 self-start rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar demo</span>
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
          {/* Foto del lugar */}
          <div className="space-y-3 lg:col-span-5">
            <p className="text-xs font-semibold text-zinc-700">Foto principal del lugar</p>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
              <Image
                src={optimizeMediaUrl(tenant.bannerUrl)}
                alt={`Portada de ${tenant.name}`}
                fill
                unoptimized={isLocalPreviewUrl(tenant.bannerUrl)}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-zinc-950/75 via-zinc-950/35 to-transparent p-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-zinc-950 text-xs font-extrabold text-white">
                  {shopInitials || tenant.logoInitials}
                </span>

                <label className="pressable inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-zinc-100">
                  <Camera className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{uploadingBanner ? "Cargando..." : "Cambiar foto"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="visually-hidden"
                  />
                </label>
              </div>
            </div>

            {tenant.bannerUrl !== DEFAULT_TENANT.bannerUrl && (
              <button
                type="button"
                onClick={() =>
                  onUpdateTenant({ ...tenant, bannerUrl: DEFAULT_TENANT.bannerUrl })
                }
                className="text-xs font-semibold text-zinc-500 underline underline-offset-4 hover:text-zinc-950"
              >
                Usar foto original
              </button>
            )}
          </div>

          {/* Formulario datos básicos */}
          <form onSubmit={handleSaveShopProfile} className="space-y-4 lg:col-span-7">
            <div className="grid gap-3.5 sm:grid-cols-4">
              <div className="sm:col-span-3">
                <label
                  htmlFor="shop-name"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Nombre de la barbería
                </label>
                <input
                  id="shop-name"
                  name="shopName"
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm font-semibold text-zinc-950 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="shop-initials"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Iniciales
                </label>
                <input
                  id="shop-initials"
                  name="shopInitials"
                  type="text"
                  maxLength={3}
                  value={shopInitials}
                  onChange={(e) => setShopInitials(e.target.value.toUpperCase())}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-center text-sm font-extrabold uppercase text-zinc-950 focus:border-zinc-950 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="shop-address"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Dirección del local
                </label>
                <input
                  id="shop-address"
                  name="shopAddress"
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="shop-hours"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Horario visible hoy
                </label>
                <input
                  id="shop-hours"
                  name="shopHours"
                  type="text"
                  value={shopHours}
                  onChange={(e) => setShopHours(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="shop-tagline"
                className="block text-xs font-semibold text-zinc-700"
              >
                Descripción breve de portada
              </label>
              <input
                id="shop-tagline"
                name="shopTagline"
                type="text"
                value={shopTagline}
                onChange={(e) => setShopTagline(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <fieldset className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
              <legend className="px-1 text-xs font-semibold text-zinc-800">
                Días fijos de cierre semanal del local (opcional)
              </legend>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAY_OPTIONS.map((w) => {
                    const selected = shopClosedWeekdays.includes(w.day);
                    return (
                      <button
                        key={w.day}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setShopClosedWeekdays((prev) =>
                            toggleWeekdayInList(prev, w.day)
                          )
                        }
                        className={cn(
                          "pressable h-9 w-9 rounded-lg border text-xs font-bold transition-colors",
                          selected
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                        )}
                        title={w.label}
                      >
                        {w.short}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] font-medium text-zinc-500">
                  {shopClosedWeekdays.length === 0
                    ? "Abierto todos los días"
                    : `Cerrado: ${WEEKDAY_OPTIONS.filter((w) =>
                        shopClosedWeekdays.includes(w.day)
                      )
                        .map((w) => w.label)
                        .join(", ")}`}
                </span>
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-zinc-500">
                Los cambios se reflejan en{" "}
                <span className="font-semibold text-zinc-800">
                  velociturno.com/{tenant.slug}
                </span>
              </p>
              <button
                type="submit"
                className={cn(
                  "pressable inline-flex min-h-[42px] items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold text-white transition-colors",
                  shopSaved ? "bg-emerald-600" : "bg-zinc-950 hover:bg-zinc-800"
                )}
              >
                {shopSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Perfil guardado</span>
                  </>
                ) : (
                  <span>Guardar perfil</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* BLOQUE 2: Equipo de Barberos y Acceso Directo Móvil */}
      <section aria-labelledby="equipo-panel-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="equipo-panel-heading"
              className="text-xl font-bold tracking-tight text-zinc-950"
            >
              Equipo de barberos y paneles móviles
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Edita nombres, fotos y envía a cada barbero su enlace directo sin contraseñas extra.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="pressable inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            <UserPlus className="h-4 w-4 text-emerald-400" />
            <span>Agregar barbero (+{formatCOP(EXTRA_BARBER_COST_COP)}/mes)</span>
          </button>
        </div>

        {/* Resumen transparente de cupos y cobro extra */}
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-600">
            <span>
              Barberos activos:{" "}
              <strong className="tabular-nums text-zinc-950">{staff.length}</strong>
            </span>
            <span className="text-zinc-300">•</span>
            <span>
              Incluidos en plan base:{" "}
              <strong className="tabular-nums text-zinc-950">{BASE_INCLUDED_BARBERS}</strong>
            </span>
            <span className="text-zinc-300">•</span>
            <span>
              Adicionales:{" "}
              <strong className="tabular-nums text-zinc-950">{extraBarbersCount}</strong> (
              {formatCOP(EXTRA_BARBER_COST_COP)}/mes c/u)
            </span>
          </div>

          <div className="tabular-nums font-bold text-zinc-950">
            {extraMonthlyTotal > 0 ? (
              <span className="text-emerald-700">
                Adicional mensual: +{formatCOP(extraMonthlyTotal)}
              </span>
            ) : (
              <span className="text-zinc-500">Sin cargos adicionales activos</span>
            )}
          </div>
        </div>

        {/* Tarjetas por barbero */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((person, index) => {
            const isExtra = index >= BASE_INCLUDED_BARBERS;
            const copied = copiedBarberId === person.id;

            return (
              <article
                key={person.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-white p-4 transition-colors",
                  person.isActive ? "border-zinc-200" : "border-zinc-200 bg-zinc-50 opacity-80"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-14 w-14 shrink-0">
                        <Image
                          src={person.avatarUrl}
                          alt={`Foto de ${person.name}`}
                          width={56}
                          height={56}
                          unoptimized={isLocalPreviewUrl(person.avatarUrl)}
                          className="h-14 w-14 rounded-full border border-zinc-200 object-cover"
                        />
                        <label
                          title={`Cambiar foto de ${person.name}`}
                          className="pressable absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 hover:text-zinc-950"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span className="visually-hidden">
                            Cambiar foto de {person.name}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDirectBarberAvatarUpload(person, e)}
                            className="visually-hidden"
                          />
                        </label>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="truncate text-sm font-bold text-zinc-950">
                            {person.name}
                          </h3>
                          {isExtra && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              +{formatCOP(EXTRA_BARBER_COST_COP)}/mes
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">
                          {uploadingStaffId === person.id
                            ? "Actualizando foto..."
                            : person.role}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStaffMember({ ...person, isActive: !person.isActive })
                      }
                      className={cn(
                        "pressable shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold",
                        person.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-zinc-300 bg-zinc-100 text-zinc-600"
                      )}
                    >
                      {person.isActive ? "Activo" : "En descanso"}
                    </button>
                  </div>

                  {/* Horarios del barbero */}
                  <div className="mt-4 space-y-1.5 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Jornada</span>
                      </span>
                      <span className="tabular-nums font-semibold text-zinc-900">
                        {person.workStart} – {person.workEnd}
                      </span>
                    </div>
                    {person.breakStart && person.breakEnd && (
                      <div className="flex items-center justify-between">
                        <span>Almuerzo</span>
                        <span className="tabular-nums font-medium text-zinc-700">
                          {person.breakStart} – {person.breakEnd}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Descanso fijo</span>
                      <span className="font-medium text-zinc-700">
                        {person.restWeekdays && person.restWeekdays.length > 0
                          ? WEEKDAY_OPTIONS.filter((w) =>
                              person.restWeekdays?.includes(w.day)
                            )
                              .map((w) => w.label)
                              .join(", ")
                          : "Sin día fijo"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones por barbero */}
                <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditBarber(person)}
                      className="pressable min-h-[38px] rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Editar nombre
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenBarberView(person.id)}
                      className="pressable inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      <span>Abrir panel</span>
                      <ExternalLink className="h-3 w-3 text-zinc-500" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyBarberLink(person)}
                      className="pressable flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-200"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Enlace de celular copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Copiar acceso móvil de {person.name.split(" ")[0]}</span>
                        </>
                      )}
                    </button>

                    {isExtra && (
                      <button
                        type="button"
                        onClick={() => onRemoveStaffMember(person.id)}
                        title={`Retirar a ${person.name}`}
                        aria-label={`Retirar barbero ${person.name}`}
                        className="pressable flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Modal Editar Barbero */}
      <ModalDialog
        open={Boolean(editingBarber)}
        onClose={() => setEditingBarber(null)}
        title="Editar perfil de barbero"
        subtitle="Actualiza su nombre, foto y horario de trabajo"
      >
        {editingBarber && (
          <form onSubmit={handleSaveEditedBarber} className="space-y-4">
            <div className="flex items-center gap-4">
              <Image
                src={editAvatarUrl || editingBarber.avatarUrl}
                alt={editName || editingBarber.name}
                width={64}
                height={64}
                unoptimized={isLocalPreviewUrl(editAvatarUrl || editingBarber.avatarUrl)}
                className="h-16 w-16 rounded-full border border-zinc-200 object-cover"
              />
              <label className="pressable inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100">
                <ImagePlus className="h-4 w-4 text-emerald-600" />
                <span>Subir nueva foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDirectBarberAvatarUpload(editingBarber, e)}
                  className="visually-hidden"
                />
              </label>
            </div>

            <div>
              <label
                htmlFor="edit-barber-name"
                className="block text-sm font-semibold text-zinc-800"
              >
                Nombre del barbero
              </label>
              <input
                id="edit-barber-name"
                name="barberName"
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1.5 min-h-[46px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-zinc-950 focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-work-start"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Hora entrada
                </label>
                <input
                  id="edit-work-start"
                  type="time"
                  value={editWorkStart}
                  onChange={(e) => setEditWorkStart(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-work-end"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Hora salida
                </label>
                <input
                  id="edit-work-end"
                  type="time"
                  value={editWorkEnd}
                  onChange={(e) => setEditWorkEnd(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-break-start"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Inicio almuerzo
                </label>
                <input
                  id="edit-break-start"
                  type="time"
                  value={editBreakStart}
                  onChange={(e) => setEditBreakStart(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-break-end"
                  className="block text-xs font-semibold text-zinc-700"
                >
                  Fin almuerzo
                </label>
                <input
                  id="edit-break-end"
                  type="time"
                  value={editBreakEnd}
                  onChange={(e) => setEditBreakEnd(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-zinc-700">
                Días fijos de descanso semanal
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_OPTIONS.map((w) => {
                  const selected = editRestWeekdays.includes(w.day);
                  return (
                    <button
                      key={w.day}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setEditRestWeekdays((prev) =>
                          toggleWeekdayInList(prev, w.day)
                        )
                      }
                      className={cn(
                        "pressable h-9 w-9 rounded-lg border text-xs font-bold transition-colors",
                        selected
                          ? "border-zinc-950 bg-zinc-950 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                      )}
                      title={w.label}
                    >
                      {w.short}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="submit"
              className="pressable min-h-[48px] w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Guardar cambios
            </button>
          </form>
        )}
      </ModalDialog>

      {/* Modal Agregar Barbero Adicional (+$6.000/mes) */}
      <ModalDialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Agregar nuevo barbero"
        subtitle={`Cada sillón adicional tiene un costo de ${formatCOP(EXTRA_BARBER_COST_COP)}/mes`}
      >
        <form onSubmit={handleCreateNewBarber} className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
            <p className="font-bold">
              {willChargeExtraOnNextAdd
                ? `Cargo adicional: +${formatCOP(EXTRA_BARBER_COST_COP)} COP / mes`
                : `Cupo incluido disponible (sin costo extra hasta ${BASE_INCLUDED_BARBERS} barberos)`}
            </p>
            <p className="mt-0.5 text-emerald-800">
              {willChargeExtraOnNextAdd
                ? `Al crear este barbero, tu adicional mensual por sillones extra pasará a ${formatCOP(
                    extraMonthlyTotal + EXTRA_BARBER_COST_COP
                  )}/mes.`
                : "Cuando superes los 3 barberos activos, cada barbero adicional suma $6.000/mes."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Image
              src={newAvatarUrl || DEFAULT_AVATAR_FALLBACK}
              alt="Vista previa barbero nuevo"
              width={60}
              height={60}
              unoptimized={isLocalPreviewUrl(newAvatarUrl || DEFAULT_AVATAR_FALLBACK)}
              className="h-15 w-15 rounded-full border border-zinc-200 object-cover"
            />
            <label className="pressable inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50">
              <ImagePlus className="h-4 w-4 text-emerald-600" />
              <span>{newAvatarUrl ? "Cambiar foto" : "Subir foto del barbero"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleNewBarberAvatarUpload}
                className="visually-hidden"
              />
            </label>
          </div>

          <div>
            <label
              htmlFor="new-barber-name"
              className="block text-sm font-semibold text-zinc-800"
            >
              Nombre completo
            </label>
            <input
              id="new-barber-name"
              name="newBarberName"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Julián Gómez"
              className="mt-1.5 min-h-[46px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="new-work-start"
                className="block text-xs font-semibold text-zinc-700"
              >
                Hora entrada
              </label>
              <input
                id="new-work-start"
                type="time"
                value={newWorkStart}
                onChange={(e) => setNewWorkStart(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              />
            </div>
            <div>
              <label
                htmlFor="new-work-end"
                className="block text-xs font-semibold text-zinc-700"
              >
                Hora salida
              </label>
              <input
                id="new-work-end"
                type="time"
                value={newWorkEnd}
                onChange={(e) => setNewWorkEnd(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="new-break-start"
                className="block text-xs font-semibold text-zinc-700"
              >
                Inicio almuerzo
              </label>
              <input
                id="new-break-start"
                type="time"
                value={newBreakStart}
                onChange={(e) => setNewBreakStart(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              />
            </div>
            <div>
              <label
                htmlFor="new-break-end"
                className="block text-xs font-semibold text-zinc-700"
              >
                Fin almuerzo
              </label>
              <input
                id="new-break-end"
                type="time"
                value={newBreakEnd}
                onChange={(e) => setNewBreakEnd(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-zinc-700">
              Días fijos de descanso semanal (opcional)
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_OPTIONS.map((w) => {
                const selected = newRestWeekdays.includes(w.day);
                return (
                  <button
                    key={w.day}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setNewRestWeekdays((prev) =>
                        toggleWeekdayInList(prev, w.day)
                      )
                    }
                    className={cn(
                      "pressable h-9 w-9 rounded-lg border text-xs font-bold transition-colors",
                      selected
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                    )}
                    title={w.label}
                  >
                    {w.short}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={assignAllServices}
              onChange={(e) => setAssignAllServices(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600"
            />
            <span>Habilitar automáticamente en todos los servicios activos</span>
          </label>

          <button
            type="submit"
            className="pressable inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>
              {willChargeExtraOnNextAdd
                ? `Agregar barbero (+${formatCOP(EXTRA_BARBER_COST_COP)}/mes)`
                : "Agregar barbero al equipo"}
            </span>
          </button>
        </form>
      </ModalDialog>
    </div>
  );
}
