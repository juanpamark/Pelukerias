"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

const PRO_PLAN_PRICE = 79000;
const WEEKS_PER_MONTH = 4;
const RECOVERY_RATE = 0.8;

export function LossCalculator() {
  const [missedPerWeek, setMissedPerWeek] = useState(3);
  const [avgTicket, setAvgTicket] = useState(30000);

  const monthlyLoss = missedPerWeek * WEEKS_PER_MONTH * avgTicket;
  const recovered = Math.round(monthlyLoss * RECOVERY_RATE);
  const cutsToCoverPlan = Math.ceil(PRO_PLAN_PRICE / avgTicket);
  const netGain = recovered - PRO_PLAN_PRICE;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Calcula cuánta plata pierdes al mes por clientes que no llegan
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-600">
            Cada cliente que te deja plantado es una silla que ya no puedes vender. Mueve
            los controles con los números reales de tu barbería.
          </p>

          <div className="mt-8 space-y-7">
            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <label htmlFor="missed-slider" className="font-semibold text-zinc-800">
                  Clientes que no llegan por semana
                </label>
                <output
                  htmlFor="missed-slider"
                  className="tabular-nums shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-bold text-zinc-950"
                >
                  {missedPerWeek} {missedPerWeek === 1 ? "cita" : "citas"}
                </output>
              </div>
              <input
                id="missed-slider"
                type="range"
                min={1}
                max={20}
                value={missedPerWeek}
                onChange={(e) => setMissedPerWeek(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-zinc-950"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <label htmlFor="ticket-slider" className="font-semibold text-zinc-800">
                  Valor promedio de un servicio
                </label>
                <output
                  htmlFor="ticket-slider"
                  className="tabular-nums shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-bold text-zinc-950"
                >
                  {formatCOP(avgTicket)}
                </output>
              </div>
              <input
                id="ticket-slider"
                type="range"
                min={20000}
                max={120000}
                step={5000}
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-zinc-950"
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6" aria-live="polite">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-600">
              <TrendingDown className="h-4 w-4" />
              <span>Plata perdida al mes</span>
            </div>
            <p className="tabular-nums mt-1.5 text-4xl font-extrabold tracking-tight text-zinc-950">
              {formatCOP(monthlyLoss)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {missedPerWeek} × {WEEKS_PER_MONTH} semanas × {formatCOP(avgTicket)}
            </p>

            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <TrendingUp className="h-4 w-4" />
                <span>Lo que recuperas con Velociturno Pro</span>
              </div>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-emerald-700">
                +{formatCOP(recovered)}{" "}
                <span className="text-xs font-medium text-emerald-700/80">/ mes</span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
                El Plan Pro ({formatCOP(PRO_PLAN_PRICE)}) se paga solo recuperando apenas{" "}
                <strong className="font-bold text-emerald-900">
                  {cutsToCoverPlan} {cutsToCoverPlan === 1 ? "corte" : "cortes"}
                </strong>{" "}
                al mes.
                {netGain > 0 && (
                  <>
                    {" "}Te quedan{" "}
                    <strong className="tabular-nums font-bold text-emerald-900">
                      {formatCOP(netGain)}
                    </strong>{" "}
                    libres.
                  </>
                )}
              </p>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              Estimado con una reducción del 80% de inasistencias gracias al anticipo y al
              recordatorio por WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
