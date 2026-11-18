import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getMockTenantBySlug } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Panel de Administración | Velociturno",
  description:
    "Gestiona la agenda híbrida de tu barbería, panel directo por barbero, servicios, perfil del local y comprobantes del 50%.",
};

export default function DashboardPage() {
  const { tenant, staff, services, bookings } = getMockTenantBySlug("los-reyes");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 p-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-14 rounded-2xl bg-zinc-200/70 animate-pulse" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="h-24 rounded-2xl bg-zinc-200/70 animate-pulse" />
              <div className="h-24 rounded-2xl bg-zinc-200/70 animate-pulse" />
              <div className="col-span-2 h-24 rounded-2xl bg-zinc-200/70 animate-pulse sm:col-span-1" />
            </div>
          </div>
        </div>
      }
    >
      <DashboardShell
        initialTenant={tenant}
        initialStaff={staff}
        initialServices={services}
        initialBookings={bookings}
      />
    </Suspense>
  );
}
