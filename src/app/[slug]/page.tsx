import type { Metadata } from "next";
import { TenantBookingExperience } from "@/components/booking/TenantBookingExperience";
import { getMockTenantBySlug } from "@/lib/mock-data";

interface TenantPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TenantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tenant } = getMockTenantBySlug(slug);

  return {
    title: `${tenant.name} | Reserva tu cita en línea - Velociturno`,
    description: tenant.tagline,
  };
}

export default async function TenantPublicPage({ params }: TenantPageProps) {
  const { slug } = await params;
  const { tenant, staff, services, bookings } = getMockTenantBySlug(slug);

  return (
    <TenantBookingExperience
      tenant={tenant}
      staff={staff}
      services={services}
      initialBookings={bookings}
    />
  );
}
