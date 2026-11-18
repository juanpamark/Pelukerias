"use client";

import { useState } from "react";
import { Clock, Edit3, Flame, Plus, Scissors, Users } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { cn, createTempId, formatCOP } from "@/lib/utils";
import type {
  PublicServiceDTO,
  PublicStaffDTO,
  ServiceCategory,
} from "@/types/velociturno";

interface ServicesManagerProps {
  services: PublicServiceDTO[];
  staff: PublicStaffDTO[];
  onSaveService: (service: PublicServiceDTO) => void;
  onToggleServiceActive: (serviceId: string) => void;
}

const CATEGORIES: ServiceCategory[] = ["Cortes", "Combos", "Barba", "Cejas"];
const DURATIONS = [15, 30, 45, 60, 75, 90];

export function ServicesManager({
  services,
  staff,
  onSaveService,
  onToggleServiceActive,
}: ServicesManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("Cortes");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [basePrice, setBasePrice] = useState(45000);
  const [isPopular, setIsPopular] = useState(false);
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>(
    staff.map((s) => s.id)
  );

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setCategory("Cortes");
    setDurationMinutes(45);
    setBasePrice(45000);
    setIsPopular(false);
    setAssignedStaffIds(staff.map((s) => s.id));
    setModalOpen(true);
  };

  const openEditModal = (srv: PublicServiceDTO) => {
    setEditingId(srv.id);
    setName(srv.name);
    setDescription(srv.description);
    setCategory(srv.category);
    setDurationMinutes(srv.durationMinutes);
    setBasePrice(srv.basePrice);
    setIsPopular(Boolean(srv.isPopular));
    setAssignedStaffIds(srv.assignedStaffIds);
    setModalOpen(true);
  };

  const toggleStaffAssignment = (staffId: string) => {
    setAssignedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || assignedStaffIds.length === 0) return;

    const existing = services.find((s) => s.id === editingId);
    onSaveService({
      id: editingId || createTempId("srv"),
      name: name.trim(),
      description:
        description.trim() || "Servicio profesional realizado en barbería.",
      category,
      durationMinutes,
      basePrice,
      isPopular,
      isActive: existing ? existing.isActive : true,
      assignedStaffIds,
      staffOverrides: existing?.staffOverrides,
    });

    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            Menú de servicios y tiempos
          </h2>
          <p className="text-xs text-zinc-500">
            Define exactamente cuánto dura cada corte o combo y qué barberos lo realizan.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="pressable inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span>Nuevo servicio</span>
        </button>
      </div>

      <div className="grid gap-3.5">
        {services.map((srv) => (
          <article
            key={srv.id}
            className={cn(
              "flex flex-col justify-between gap-4 rounded-2xl border bg-white p-4 transition-colors sm:flex-row sm:items-center",
              srv.isActive
                ? "border-zinc-200"
                : "border-zinc-200 bg-zinc-50 opacity-65"
            )}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                  <Scissors className="h-3 w-3 text-zinc-500" />
                  {srv.category}
                </span>
                <h3 className="text-base font-bold text-zinc-950">{srv.name}</h3>
                {srv.isPopular && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    <Flame className="h-3 w-3 text-amber-600" />
                    Más pedido
                  </span>
                )}
              </div>

              <p className="max-w-2xl text-xs leading-relaxed text-zinc-600">
                {srv.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                <span className="inline-flex items-center gap-1 font-medium text-zinc-600">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  <strong className="tabular-nums text-zinc-950">
                    {srv.durationMinutes} min
                  </strong>
                </span>

                <span className="tabular-nums font-bold text-zinc-950">
                  Base: {formatCOP(srv.basePrice)}
                </span>

                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Users className="h-3.5 w-3.5" />
                  {srv.assignedStaffIds.length}{" "}
                  {srv.assignedStaffIds.length === 1 ? "barbero" : "barberos"}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(srv)}
                className="pressable inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleServiceActive(srv.id)}
                className={cn(
                  "pressable min-h-[38px] rounded-xl border px-3 py-1.5 text-xs font-semibold",
                  srv.isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {srv.isActive ? "Activo" : "Pausado"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Modal Crear / Editar Servicio */}
      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar servicio" : "Agregar nuevo servicio"}
        subtitle="El motor anti-huecos usa esta duración exacta para calcular tu agenda"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="srv-name" className="block text-sm font-semibold text-zinc-800">
              Nombre del servicio
            </label>
            <input
              id="srv-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Corte Degradado + Cejas"
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="srv-cat" className="block text-sm font-semibold text-zinc-800">
                Categoría
              </label>
              <select
                id="srv-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="srv-dur" className="block text-sm font-semibold text-zinc-800">
                Duración exacta
              </label>
              <select
                id="srv-dur"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-950"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} minutos
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="srv-price" className="block text-sm font-semibold text-zinc-800">
              Precio base (COP)
            </label>
            <input
              id="srv-price"
              type="number"
              min={5000}
              step={1000}
              required
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="srv-desc" className="block text-sm font-semibold text-zinc-800">
              Descripción breve (visible para tus clientes)
            </label>
            <textarea
              id="srv-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Incluye lavado, perfilado y aplicación de cera."
              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-zinc-800">
              ¿Qué barberos ofrecen este servicio?
            </legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {staff.map((person) => {
                const selected = assignedStaffIds.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleStaffAssignment(person.id)}
                    className={cn(
                      "pressable rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                      selected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    {person.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-600"
            />
            <span>Destacar con etiqueta &ldquo;Más pedido&rdquo;</span>
          </label>

          <button
            type="submit"
            className="pressable min-h-[48px] w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            {editingId ? "Guardar cambios" : "Crear servicio"}
          </button>
        </form>
      </ModalDialog>
    </div>
  );
}
