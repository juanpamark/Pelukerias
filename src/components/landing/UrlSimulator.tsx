"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Pencil, PlayCircle } from "lucide-react";
import { slugify } from "@/lib/utils";

export function UrlSimulator() {
  const [shopName, setShopName] = useState("Barbería Los Reyes");
  const slug = slugify(shopName) || "mi-barberia";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(9,9,11,0.04),0_12px_32px_-12px_rgba(9,9,11,0.12)] sm:p-5">
      <label
        htmlFor="shop-simulator-input"
        className="flex items-center gap-2 text-sm font-bold text-zinc-950"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
        <span>
          Escribe el nombre de tu barbería{" "}
          <span className="text-emerald-700">y mira cómo quedaría</span>
        </span>
      </label>

      {/* Prefijo fijo + campo editable claramente separados */}
      <div className="mt-2.5 flex min-h-[52px] w-full items-stretch overflow-hidden rounded-xl border border-zinc-300 bg-white transition-[border-color,box-shadow] duration-150 focus-within:border-zinc-900 focus-within:ring-4 focus-within:ring-zinc-900/10">
        <span className="flex shrink-0 select-none items-center border-r border-zinc-200 bg-zinc-100 px-2.5 text-xs font-medium text-zinc-500 sm:px-3 sm:text-sm">
          velociturno.com/
        </span>
        <input
          id="shop-simulator-input"
          type="text"
          size={1}
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="tu-barberia"
          maxLength={40}
          autoComplete="organization"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          className="min-w-0 w-full flex-1 bg-transparent px-2.5 text-sm font-semibold text-zinc-900 caret-emerald-600 placeholder:text-zinc-400 focus:outline-none sm:px-3 sm:text-base"
        />
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center pr-3 text-zinc-400 sm:pr-3.5"
        >
          <Pencil className="h-4 w-4" />
        </span>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="truncate">
          Vista previa:{" "}
          <strong className="font-semibold text-zinc-900">
            velociturno.com/{slug}
          </strong>
        </span>
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-[1fr_auto]">
        <Link
          href={`/${slug}`}
          className="pressable inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
        >
          <span>Ver cómo quedaría mi página</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/los-reyes"
          className="pressable inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
        >
          <PlayCircle className="h-4 w-4 text-emerald-600" />
          <span>Ver ejemplo real</span>
        </Link>
      </div>
    </div>
  );
}
