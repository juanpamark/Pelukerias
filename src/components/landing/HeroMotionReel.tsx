"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Check, CheckCheck, Copy, ImagePlus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hero Product Reel (launch-motion + choreograph):
 * Demo vectorial de 3 escenas que cuenta la historia completa de Velociturno
 * sin cargar video: cliente agenda → paga 50% a Nequi → barbero aprueba y sale el WhatsApp.
 * - Cursor con trayectoria en arco (x ease-in-out, y ease-out distintos = curva natural).
 * - Press táctil 1 → 0.96 → 1 en el elemento que se toca.
 * - Reproducción continua sin pausa al pasar el cursor; con prefers-reduced-motion muestra el estado final sin cursor.
 */

type Beat = { at: number; target?: string; press?: boolean };

const SCENES: { label: string; duration: number; beats: Beat[] }[] = [
  {
    label: "Tu cliente agenda",
    duration: 4200,
    beats: [
      { at: 550, target: "slot" },
      { at: 1350, target: "slot", press: true },
      { at: 2150, target: "next" },
      { at: 2900, target: "next", press: true },
    ],
  },
  {
    label: "Paga 50% a tu Nequi",
    duration: 4200,
    beats: [
      { at: 550, target: "copy" },
      { at: 1300, target: "copy", press: true },
      { at: 2050, target: "upload" },
      { at: 2800, target: "upload", press: true },
    ],
  },
  {
    label: "Tú apruebas en 1 toque",
    duration: 5200,
    beats: [
      { at: 550, target: "approve" },
      { at: 1350, target: "approve", press: true },
      { at: 2150 },
    ],
  },
];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

const pressVariants = {
  idle: { scale: 1 },
  press: { scale: [1, 0.96, 1], transition: { duration: 0.22, ease: EASE_OUT } },
};

export function HeroMotionReel() {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  const [scene, setScene] = useState(0);
  const [beat, setBeat] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const moveCursorTo = useCallback((target?: string) => {
    if (!target) return;
    const stage = stageRef.current;
    const el = stage?.querySelector<HTMLElement>(`[data-cursor="${target}"]`);
    if (!stage || !el) return;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCursor({
      x: r.left - s.left + r.width * 0.62,
      y: r.top - s.top + r.height * 0.6,
      visible: true,
    });
  }, []);

  const goTo = useCallback((next: number) => {
    setScene(next);
    setBeat(0);
    setRunKey((k) => k + 1);
  }, []);

  // Línea de tiempo de la escena: cada beat avanza el estado y mueve el cursor de forma continua.
  useEffect(() => {
    if (reduceMotion) return;
    const { beats, duration } = SCENES[scene];
    const timers = beats.map((b, i) =>
      setTimeout(() => {
        setBeat(i + 1);
        moveCursorTo(b.target);
      }, b.at)
    );
    timers.push(setTimeout(() => goTo((scene + 1) % SCENES.length), duration));
    return () => timers.forEach(clearTimeout);
  }, [scene, runKey, reduceMotion, goTo, moveCursorTo]);

  const b = reduceMotion ? 99 : beat;
  const currentBeat = SCENES[scene].beats[beat - 1];
  const pressTarget = !reduceMotion && currentBeat?.press ? currentBeat.target : null;
  const pressFor = (t: string) => (pressTarget === t ? "press" : "idle");

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-[400px]">
        <p className="visually-hidden">
          Demostración: un cliente reserva un Corte Platinum a las 9:45 a. m., paga el 50%
          por Nequi y sube su comprobante; el barbero lo aprueba en un toque y el cliente
          recibe la confirmación por WhatsApp.
        </p>

        {/* Dispositivo */}
        <div className="rounded-[30px] bg-zinc-950 p-2 shadow-[0_30px_60px_-20px_rgba(9,9,11,0.45)]">
          <div
            ref={stageRef}
            aria-hidden="true"
            className="relative h-[452px] overflow-hidden rounded-[23px] bg-white"
          >
            {/* Barra superior del negocio (estática: no anima) */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-bold text-white">
                  LR
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-zinc-950">Barbería Los Reyes</p>
                  <p className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    4.9 · Suba, Bogotá
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Abierto
              </span>
            </div>

            <div className="relative h-[calc(100%-57px)]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={scene}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.18, ease: EASE_OUT } }}
                  transition={{ duration: 0.34, ease: EASE_OUT }}
                  className="absolute inset-0 p-4"
                >
                  {scene === 0 && <SceneBooking beat={b} pressFor={pressFor} />}
                  {scene === 1 && <SceneDeposit beat={b} pressFor={pressFor} />}
                  {scene === 2 && <SceneApprove beat={b} pressFor={pressFor} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Cursor con trayectoria en arco */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute left-0 top-0 z-20"
                initial={false}
                animate={{ x: cursor.x, y: cursor.y, opacity: cursor.visible ? 1 : 0 }}
                transition={{
                  x: { duration: 0.7, ease: EASE_IN_OUT },
                  y: { duration: 0.7, ease: EASE_OUT },
                  opacity: { duration: 0.2 },
                }}
              >
                <motion.div
                  variants={{
                    idle: { scale: 1 },
                    press: { scale: [1, 0.82, 1], transition: { duration: 0.24, ease: EASE_OUT } },
                  }}
                  animate={pressTarget ? "press" : "idle"}
                  className="relative"
                >
                  {pressTarget && (
                    <motion.span
                      key={`${scene}-${beat}`}
                      className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-zinc-950/15"
                      initial={{ scale: 0.4, opacity: 1 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                    />
                  )}
                  <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-md">
                    <path
                      d="M4 2.5l15 8.2-6.6 1.6-3 6.2L4 2.5z"
                      fill="#09090b"
                      stroke="#fff"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Selector de escenas */}
        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
          {SCENES.map((s, i) => {
            const active = i === scene;
            return (
              <button
                key={s.label}
                type="button"
                aria-pressed={active}
                onClick={() => goTo(i)}
                className={cn(
                  "pressable relative min-w-0 overflow-hidden rounded-xl border px-2 py-2.5 text-left text-[11px] font-semibold leading-tight transition-colors sm:text-xs",
                  active
                    ? "border-zinc-950 bg-white text-zinc-950"
                    : "border-zinc-200 bg-white/60 text-zinc-500 hover:text-zinc-800"
                )}
              >
                <span className="tabular-nums block text-[10px] font-bold text-zinc-400">
                  0{i + 1}
                </span>
                {s.label}
                {active && !reduceMotion && (
                  <motion.span
                    key={runKey}
                    className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-emerald-600"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: s.duration / 1000, ease: "linear" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </MotionConfig>
  );
}

type SceneProps = { beat: number; pressFor: (t: string) => "press" | "idle" };

function SceneBooking({ beat, pressFor }: SceneProps) {
  const selected = beat >= 2;
  const slots = [
    { t: "9:00", taken: true },
    { t: "9:45", key: "slot" },
    { t: "10:30" },
    { t: "11:15" },
    { t: "12:00" },
    { t: "2:00 p.m." },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="rounded-2xl border border-zinc-200 p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-950">Corte Platinum</p>
            <p className="text-[11px] text-zinc-500">45 min · con Carlos (Platinum)</p>
          </div>
          <p className="tabular-nums text-sm font-bold text-zinc-950">$65.000</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Hoy, mar 17 nov
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {slots.map((s) => {
          const isTarget = s.key === "slot";
          const isSelected = isTarget && selected;
          return (
            <motion.div
              key={s.t}
              data-cursor={s.key}
              variants={pressVariants}
              animate={isTarget ? pressFor("slot") : "idle"}
              className={cn(
                "tabular-nums relative flex h-10 items-center justify-center rounded-xl border text-xs font-semibold transition-colors duration-200",
                s.taken && "border-zinc-100 bg-zinc-50 text-zinc-300 line-through",
                !s.taken && !isSelected && "border-zinc-200 text-zinc-800",
                isSelected && "border-zinc-950 bg-zinc-950 text-white"
              )}
            >
              {s.t}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="mt-3 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] font-medium text-emerald-800"
          >
            9:45 empieza justo cuando termina la cita anterior. Cero tiempo muerto.
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        data-cursor="next"
        variants={pressVariants}
        animate={pressFor("next")}
        className={cn(
          "mt-auto flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors duration-200",
          selected ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-400"
        )}
      >
        {selected ? "Continuar · 9:45 a. m." : "Elige un horario"}
      </motion.div>
    </div>
  );
}

function SceneDeposit({ beat, pressFor }: SceneProps) {
  const copied = beat >= 2;
  const uploaded = beat >= 4;

  return (
    <div className="flex h-full flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Anticipo para separar tu turno
      </p>
      <p className="tabular-nums mt-1 text-3xl font-extrabold tracking-tight text-emerald-600">
        $32.500
      </p>
      <p className="text-[11px] text-zinc-500">50% de $65.000 · el resto lo pagas en el local</p>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-200 p-3">
        <div>
          <p className="text-xs font-bold text-zinc-950">
            Nequi · <span className="tabular-nums">300 412 8890</span>
          </p>
          <p className="text-[11px] text-zinc-500">Titular: Carlos Mendoza</p>
        </div>
        <motion.div
          data-cursor="copy"
          variants={pressVariants}
          animate={pressFor("copy")}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-200",
            copied
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-zinc-50 text-zinc-700"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </motion.div>
      </div>

      <motion.div
        data-cursor="upload"
        variants={pressVariants}
        animate={pressFor("upload")}
        className={cn(
          "mt-3 flex h-[68px] items-center gap-3 rounded-2xl border px-3 transition-colors duration-200",
          uploaded ? "border-emerald-200 bg-emerald-50/60" : "border-dashed border-zinc-300"
        )}
      >
        {uploaded ? (
          <>
            <div className="flex h-11 w-9 flex-col justify-between rounded-md border border-emerald-200 bg-white p-1">
              <span className="h-1 w-full rounded bg-fuchsia-500/70" />
              <span className="h-1 w-3/4 rounded bg-zinc-200" />
              <span className="h-1 w-1/2 rounded bg-zinc-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-950">comprobante-nequi.jpg</p>
              <p className="text-[11px] text-emerald-700">Listo para verificar</p>
            </div>
            <Check className="h-4 w-4 text-emerald-600" />
          </>
        ) : (
          <>
            <ImagePlus className="h-5 w-5 text-zinc-400" />
            <p className="text-xs font-semibold text-zinc-700">Subir captura del comprobante</p>
          </>
        )}
      </motion.div>

      <div
        className={cn(
          "mt-auto flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors duration-200",
          uploaded ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-400"
        )}
      >
        Separar mi turno
      </div>
    </div>
  );
}

function SceneApprove({ beat, pressFor }: SceneProps) {
  const approved = beat >= 2;
  const whatsapp = beat >= 3;

  return (
    <div className="flex h-full flex-col">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        Tu panel · Agenda de hoy
      </p>

      <div
        className={cn(
          "mt-2 rounded-2xl border p-3 transition-colors duration-300",
          approved ? "border-emerald-200 bg-white" : "border-amber-200 bg-amber-50/50"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="tabular-nums text-[11px] font-bold text-zinc-500">9:45 – 10:30 a. m.</span>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors duration-300",
              approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
            )}
          >
            {approved ? "Confirmada" : "Verificar 50%"}
          </span>
        </div>
        <p className="mt-1.5 text-sm font-bold text-zinc-950">Juan Pérez</p>
        <p className="text-[11px] text-zinc-500">Corte Platinum · Carlos</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="tabular-nums text-[11px] font-medium text-zinc-700">
            Nequi recibido: $32.500
          </span>
          {approved ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Aprobado
            </span>
          ) : (
            <motion.div
              data-cursor="approve"
              variants={pressVariants}
              animate={pressFor("approve")}
              className="rounded-lg bg-zinc-950 px-2.5 py-1.5 text-[11px] font-semibold text-white"
            >
              Aprobar
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <AnimatePresence>
          {whatsapp && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
              className="rounded-2xl bg-[#e7f8ee] p-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                WhatsApp · Barbería Los Reyes
              </p>
              <div className="mt-1.5 rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                <p className="text-xs leading-relaxed text-zinc-800">
                  Hola Juan, tu cita quedó confirmada para hoy a las 9:45 a. m. con Carlos. Te
                  recordamos 2 horas antes.
                </p>
                <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-zinc-400">
                  9:12 a. m. <CheckCheck className="h-3 w-3 text-sky-500" />
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
