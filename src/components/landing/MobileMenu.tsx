"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, PlayCircle, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#calculadora", label: "Calculadora" },
  { href: "#planes", label: "Planes" },
  { href: "#preguntas", label: "Preguntas" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-landing-menu"
        aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        onClick={() => setOpen((prev) => !prev)}
        className="pressable inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          id="mobile-landing-menu"
          className="absolute inset-x-0 top-16 z-40 border-b border-zinc-200 bg-white px-5 py-4 shadow-xl"
        >
          <nav aria-label="Menú móvil" className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-zinc-100 pt-3">
            <Link
              href="/los-reyes"
              onClick={() => setOpen(false)}
              className="pressable inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              <PlayCircle className="h-4 w-4 text-emerald-600" />
              <span>Ver ejemplo real</span>
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="pressable inline-flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-950 px-3 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
