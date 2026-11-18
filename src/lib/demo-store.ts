import { useSyncExternalStore } from "react";
import type {
  BookingRecord,
  PublicServiceDTO,
  PublicStaffDTO,
  PublicTenantDTO,
} from "@/types/velociturno";

export interface DemoTenantSnapshot {
  tenant: PublicTenantDTO;
  staff: PublicStaffDTO[];
  services: PublicServiceDTO[];
  bookings: BookingRecord[];
}

const SNAPSHOT_PREFIX = "velociturno:demo:v1:";
const PINNED_BARBER_PREFIX = "velociturno:pinned-barber:v1:";

const listeners = new Set<() => void>();
const snapshotCache = new Map<
  string,
  { raw: string; value: DemoTenantSnapshot }
>();

function emitStoreChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => listeners.delete(listener);
  }

  const handleStorage = () => listener();
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function loadDemoSnapshot(slug: string): DemoTenantSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${SNAPSHOT_PREFIX}${slug}`);
    if (!raw) return null;

    const cached = snapshotCache.get(slug);
    if (cached && cached.raw === raw) {
      return cached.value;
    }

    const parsed = JSON.parse(raw) as Partial<DemoTenantSnapshot>;
    if (
      !parsed.tenant ||
      !Array.isArray(parsed.staff) ||
      !Array.isArray(parsed.services) ||
      !Array.isArray(parsed.bookings)
    ) {
      return null;
    }

    const value = parsed as DemoTenantSnapshot;
    snapshotCache.set(slug, { raw, value });
    return value;
  } catch {
    return null;
  }
}

export function saveDemoSnapshot(slug: string, snapshot: DemoTenantSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(snapshot);
    window.localStorage.setItem(`${SNAPSHOT_PREFIX}${slug}`, raw);
    snapshotCache.set(slug, { raw, value: snapshot });
    emitStoreChange();
  } catch {
    // Ignorar errores de cuota de almacenamiento local
  }
}

export function clearDemoSnapshot(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${SNAPSHOT_PREFIX}${slug}`);
    snapshotCache.delete(slug);
    emitStoreChange();
  } catch {
    // Sin acción
  }
}

export function loadPinnedBarberId(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${PINNED_BARBER_PREFIX}${slug}`);
  } catch {
    return null;
  }
}

export function savePinnedBarberId(slug: string, staffId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${PINNED_BARBER_PREFIX}${slug}`;
    if (!staffId) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, staffId);
    }
    emitStoreChange();
  } catch {
    // Sin acción
  }
}

export function useDemoSnapshot(
  slug: string,
  fallbackSnapshot: DemoTenantSnapshot
): DemoTenantSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => loadDemoSnapshot(slug) ?? fallbackSnapshot,
    () => fallbackSnapshot
  );
}

export function usePinnedBarberId(slug: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => loadPinnedBarberId(slug),
    () => null
  );
}
