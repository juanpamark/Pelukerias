"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  MessageSquareCheck,
  QrCode,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicTenantDTO } from "@/types/velociturno";

interface WhatsAppAndPaymentsPanelProps {
  tenant: PublicTenantDTO;
  onToggleDeposit50: () => void;
  onUpdateAccount: (index: number, accountNumber: string, accountHolder: string) => void;
}

export function WhatsAppAndPaymentsPanel({
  tenant,
  onToggleDeposit50,
  onUpdateAccount,
}: WhatsAppAndPaymentsPanelProps) {
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const publicUrl = `https://velociturno.com/${tenant.slug}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      // Fallback visual
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Bloque 1: Anticipo del 50% por transferencia */}
      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-950">
                Anticipo del 50% (Sin comisiones)
              </h2>
              <p className="text-xs text-zinc-500">
                Solicita comprobante de transferencia a tus clientes para confirmar su turno.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={tenant.requireDeposit50}
            onClick={onToggleDeposit50}
            className={cn(
              "pressable relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              tenant.requireDeposit50 ? "bg-emerald-600" : "bg-zinc-200"
            )}
          >
            <span className="visually-hidden">Exigir anticipo del 50%</span>
            <span
              className={cn(
                "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform",
                tenant.requireDeposit50 ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        <div className="space-y-3">
          {tenant.paymentAccounts.map((acc, index) => {
            const numId = `acc-number-${index}`;
            const holderId = `acc-holder-${index}`;

            return (
              <div
                key={acc.bankName}
                className="space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-950">
                    {acc.bankName}
                  </span>
                  <span className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                    Visible al reservar
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={numId}
                      className="block text-[11px] font-medium text-zinc-600"
                    >
                      Número o Llave
                    </label>
                    <input
                      id={numId}
                      type="text"
                      value={acc.accountNumber}
                      onChange={(e) =>
                        onUpdateAccount(index, e.target.value, acc.accountHolder)
                      }
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-zinc-300 bg-white px-2.5 text-sm font-semibold text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={holderId}
                      className="block text-[11px] font-medium text-zinc-600"
                    >
                      Titular de la cuenta
                    </label>
                    <input
                      id={holderId}
                      type="text"
                      value={acc.accountHolder}
                      onChange={(e) =>
                        onUpdateAccount(index, acc.accountNumber, e.target.value)
                      }
                      className="mt-1 min-h-[40px] w-full rounded-lg border border-zinc-300 bg-white px-2.5 text-sm font-medium text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bloque 2: WhatsApp Pro (Evolution API) */}
      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MessageSquareCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-950">
                WhatsApp Automático (Plan Pro)
              </h2>
              <p className="text-xs text-zinc-500">
                Envía recordatorios 2 horas antes desde tu propio número mediante Evolution API.
              </p>
            </div>
          </div>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              whatsappConnected
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                whatsappConnected ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
            {whatsappConnected ? "Conectado" : "Pendiente QR"}
          </span>
        </div>

        {whatsappConnected ? (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-950">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Instancia activa: {tenant.whatsappNumberDisplay}</span>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappConnected(false)}
                className="text-xs font-semibold text-zinc-500 hover:text-rose-600"
              >
                Desvincular
              </button>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              Plantilla activa (2 horas antes):{" "}
              <em className="text-zinc-900">
                &ldquo;Hola {"{nombre}"}, te recordamos tu cita en {tenant.name} hoy a las{" "}
                {"{hora}"} con {"{barbero}"}.&rdquo;
              </em>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center">
            <QrCode className="h-16 w-16 text-zinc-900" />
            <p className="mt-2 text-sm font-bold text-zinc-950">
              Escanea desde WhatsApp Business
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Ajustes &rarr; Dispositivos vinculados &rarr; Vincular dispositivo
            </p>
            <button
              type="button"
              onClick={() => setWhatsappConnected(true)}
              className="pressable mt-3 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              Simular vinculación exitosa
            </button>
          </div>
        )}

        {/* Kit de Enlace y Código QR del Local */}
        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-950">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <span>Enlace para biografía de Instagram y QR de mostrador</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
            <code className="flex-1 truncate px-2 text-xs font-semibold text-zinc-700">
              {publicUrl}
            </code>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="pressable inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar enlace</span>
                </>
              )}
            </button>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            En Fase 4 conectaremos este módulo con Supabase pg_cron + Evolution API.
          </p>
        </div>
      </section>
    </div>
  );
}
