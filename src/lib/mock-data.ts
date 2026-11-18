import type {
  BookingRecord,
  PublicServiceDTO,
  PublicStaffDTO,
  PublicTenantDTO,
} from "@/types/velociturno";

export const DEFAULT_TENANT: PublicTenantDTO = {
  id: "tenant-los-reyes-001",
  slug: "los-reyes",
  name: "Barbería Los Reyes",
  tagline: "Cortes de precisión, asesoría de imagen y ritual de barba en el norte de Bogotá.",
  address: "Cra. 59 #130A-80",
  district: "Ciudad Jardín Norte, Suba",
  city: "Bogotá, D.C.",
  isOpenNow: true,
  openHoursLabel: "Hoy: 9:00 a. m. – 8:00 p. m.",
  rating: 4.9,
  reviewCount: 1240,
  bannerUrl:
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1400&q=80",
  logoInitials: "LR",
  requireDeposit50: true,
  closedWeekdays: [],
  closedDates: [],
  paymentAccounts: [
    {
      bankName: "Nequi",
      accountNumber: "300 412 8890",
      accountHolder: "Carlos Mendoza",
    },
    {
      bankName: "Llave Bre-B",
      accountNumber: "@losreyesbarber",
      accountHolder: "Barbería Los Reyes SAS",
    },
  ],
  whatsappNumberDisplay: "300 412 8890",
};

export const MOCK_STAFF: PublicStaffDTO[] = [
  {
    id: "staff-carlos",
    name: "Carlos Mendoza",
    role: "Barbero Profesional",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80",
    rating: 5.0,
    reviewCount: 518,
    workStart: "09:00",
    workEnd: "20:00",
    breakStart: "13:00",
    breakEnd: "14:00",
    isActive: true,
  },
  {
    id: "staff-mateo",
    name: "Mateo Silva",
    role: "Barbero Profesional",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
    rating: 4.9,
    reviewCount: 412,
    workStart: "09:00",
    workEnd: "19:30",
    breakStart: "13:30",
    breakEnd: "14:30",
    isActive: true,
  },
  {
    id: "staff-andres",
    name: "Andrés Rojas",
    role: "Barbero Profesional",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=320&q=80",
    rating: 4.8,
    reviewCount: 310,
    workStart: "10:00",
    workEnd: "20:00",
    breakStart: "14:00",
    breakEnd: "15:00",
    isActive: true,
  },
];

export const MOCK_SERVICES: PublicServiceDTO[] = [
  {
    id: "srv-corte-platinum",
    name: "Corte de Precisión & Styling",
    description:
      "Corte a tijera y máquina de alta precisión, lavado capilar refrescante y peinado con cera mate.",
    category: "Cortes",
    durationMinutes: 45,
    basePrice: 35000,
    isPopular: true,
    isActive: true,
    assignedStaffIds: ["staff-carlos", "staff-mateo", "staff-andres"],
  },
  {
    id: "srv-corte-asesoria",
    name: "Corte Asesoría de Imagen",
    description:
      "Diagnóstico de visagismo facial según tu tipo de rostro, corte personalizado y rutina de cuidado.",
    category: "Cortes",
    durationMinutes: 60,
    basePrice: 55000,
    isPopular: false,
    isActive: true,
    assignedStaffIds: ["staff-carlos", "staff-mateo", "staff-andres"],
  },
  {
    id: "srv-corte-barba-platinum",
    name: "Corte + Barba Completo",
    description:
      "Nuestro combo insignia: corte completo más ritual de barba con toalla caliente, ozono y bálsamo.",
    category: "Combos",
    durationMinutes: 75,
    basePrice: 65000,
    isPopular: true,
    isActive: true,
    assignedStaffIds: ["staff-carlos", "staff-mateo", "staff-andres"],
  },
  {
    id: "srv-barba-express",
    name: "Perfilado y Ritual de Barba",
    description:
      "Alineado a navaja, hidratación con aceites esenciales y compresa caliente relajante.",
    category: "Barba",
    durationMinutes: 30,
    basePrice: 35000,
    isPopular: false,
    isActive: true,
    assignedStaffIds: ["staff-carlos", "staff-mateo", "staff-andres"],
  },
  {
    id: "srv-cejas",
    name: "Diseño de Cejas con Navaja",
    description:
      "Limpieza natural y definición simétrica con navaja desechable y gel calmante.",
    category: "Cejas",
    durationMinutes: 15,
    basePrice: 15000,
    isPopular: false,
    isActive: true,
    assignedStaffIds: ["staff-mateo", "staff-andres"],
  },
];

export const UPCOMING_SCHEDULE_DAYS = [
  { date: "2026-11-18", labelTop: "Hoy", labelDay: "18", labelMonth: "Nov" },
  { date: "2026-11-19", labelTop: "Mañana", labelDay: "19", labelMonth: "Nov" },
  { date: "2026-11-20", labelTop: "Vie", labelDay: "20", labelMonth: "Nov" },
  { date: "2026-11-21", labelTop: "Sáb", labelDay: "21", labelMonth: "Nov" },
  { date: "2026-11-22", labelTop: "Dom", labelDay: "22", labelMonth: "Nov" },
  { date: "2026-11-23", labelTop: "Lun", labelDay: "23", labelMonth: "Nov" },
];

export function getTodayISO(): string {
  // Fecha fija determinística del día actual en Colombia para datos iniciales consistentes
  return "2026-11-18";
}

export function getInitialBookings(): BookingRecord[] {
  const today = getTodayISO();
  const tomorrow = "2026-11-19";
  return [
    {
      id: "bk-101",
      tenantSlug: "los-reyes",
      staffId: "staff-carlos",
      serviceId: "srv-corte-platinum",
      serviceName: "Corte de Precisión & Styling",
      staffName: "Carlos Mendoza",
      customerName: "Sebastián Vargas",
      customerPhone: "312 890 4412",
      date: today,
      startTime: "09:00",
      endTime: "09:45",
      durationMinutes: 45,
      totalPrice: 35000,
      depositRequired: true,
      depositAmount: 17500,
      status: "completed",
    },
    {
      id: "bk-102",
      tenantSlug: "los-reyes",
      staffId: "staff-carlos",
      serviceId: "srv-corte-asesoria",
      serviceName: "Corte Asesoría de Imagen",
      staffName: "Carlos Mendoza",
      customerName: "Camilo Restrepo",
      customerPhone: "315 224 9087",
      date: today,
      startTime: "10:30",
      endTime: "11:30",
      durationMinutes: 60,
      totalPrice: 55000,
      depositRequired: true,
      depositAmount: 27500,
      status: "in_chair",
    },
    {
      id: "bk-103",
      tenantSlug: "los-reyes",
      staffId: "staff-carlos",
      serviceId: "srv-corte-barba-platinum",
      serviceName: "Corte + Barba Completo",
      staffName: "Carlos Mendoza",
      customerName: "Felipe Morales",
      customerPhone: "301 667 3120",
      date: today,
      startTime: "15:00",
      endTime: "16:15",
      durationMinutes: 75,
      totalPrice: 65000,
      depositRequired: true,
      depositAmount: 32500,
      receiptUrl: "comprobante-nequi-demo",
      status: "pending_verification",
      note: "Transfirió $32.500 por Nequi ref #8821",
    },
    {
      id: "bk-104",
      tenantSlug: "los-reyes",
      staffId: "staff-mateo",
      serviceId: "srv-corte-platinum",
      serviceName: "Corte de Precisión & Styling",
      staffName: "Mateo Silva",
      customerName: "Daniel Ospina",
      customerPhone: "320 441 7811",
      date: today,
      startTime: "09:30",
      endTime: "10:15",
      durationMinutes: 45,
      totalPrice: 35000,
      depositRequired: true,
      depositAmount: 17500,
      status: "confirmed",
    },
    {
      id: "bk-105",
      tenantSlug: "los-reyes",
      staffId: "staff-mateo",
      serviceId: "srv-barba-express",
      serviceName: "Perfilado y Ritual de Barba",
      staffName: "Mateo Silva",
      customerName: "Nicolás Herrera",
      customerPhone: "310 554 1190",
      date: today,
      startTime: "11:00",
      endTime: "11:30",
      durationMinutes: 30,
      totalPrice: 35000,
      depositRequired: true,
      depositAmount: 17500,
      receiptUrl: "comprobante-nequi-demo",
      status: "pending_verification",
      note: "Comprobante enviado por web - Nequi $17.500",
    },
    {
      id: "bk-106",
      tenantSlug: "los-reyes",
      staffId: "staff-andres",
      serviceId: "srv-corte-platinum",
      serviceName: "Corte de Precisión & Styling",
      staffName: "Andrés Rojas",
      customerName: "Alejandro Castro",
      customerPhone: "318 902 5534",
      date: today,
      startTime: "10:00",
      endTime: "10:45",
      durationMinutes: 45,
      totalPrice: 35000,
      depositRequired: true,
      depositAmount: 17500,
      status: "confirmed",
    },
    {
      id: "bk-107",
      tenantSlug: "los-reyes",
      staffId: "staff-carlos",
      serviceId: "srv-corte-platinum",
      serviceName: "Corte de Precisión & Styling",
      staffName: "Carlos Mendoza",
      customerName: "Julián Quintero",
      customerPhone: "311 402 9921",
      date: tomorrow,
      startTime: "10:00",
      endTime: "10:45",
      durationMinutes: 45,
      totalPrice: 35000,
      depositRequired: true,
      depositAmount: 17500,
      status: "confirmed",
    },
    {
      id: "bk-108",
      tenantSlug: "los-reyes",
      staffId: "staff-andres",
      serviceId: "srv-corte-barba-platinum",
      serviceName: "Corte + Barba Completo",
      staffName: "Andrés Rojas",
      customerName: "Mateo Lozano",
      customerPhone: "317 778 2104",
      date: tomorrow,
      startTime: "15:00",
      endTime: "16:15",
      durationMinutes: 75,
      totalPrice: 65000,
      depositRequired: true,
      depositAmount: 32500,
      receiptUrl: "comprobante-nequi-demo",
      status: "pending_verification",
      note: "Transferencia Llave Bre-B $32.500",
    },
  ];
}

function formatSlugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getMockTenantBySlug(slug: string): {
  tenant: PublicTenantDTO;
  staff: PublicStaffDTO[];
  services: PublicServiceDTO[];
  bookings: BookingRecord[];
} {
  const cleanSlug = slug.toLowerCase().trim();

  if (
    cleanSlug === "los-reyes" ||
    cleanSlug === "losreyes" ||
    cleanSlug === "barberia-los-reyes"
  ) {
    return {
      tenant: DEFAULT_TENANT,
      staff: MOCK_STAFF,
      services: MOCK_SERVICES,
      bookings: getInitialBookings(),
    };
  }

  // Simulador dinámico: cualquier slug ingresado en la Landing B2B genera una vista previa realista
  const displayName = formatSlugToTitle(cleanSlug) || "Mi Barbería";
  const words = displayName.split(" ");
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  return {
    tenant: {
      ...DEFAULT_TENANT,
      id: `tenant-${cleanSlug}`,
      slug: cleanSlug,
      name: displayName,
      tagline: `Reserva tu turno en ${displayName} sin esperas ni llamadas.`,
      address: "Zona Rosa / Sector Principal",
      district: "Vista previa interactiva",
      city: "Colombia",
      // Pillar 5: Si un negocio nuevo tiene 0 reseñas, ocultamos estrellas en vez de mostrar "5.0 (0)"
      rating: 0,
      reviewCount: 0,
      logoInitials: initials,
    },
    staff: MOCK_STAFF,
    services: MOCK_SERVICES,
    bookings: getInitialBookings().map((b) => ({ ...b, tenantSlug: cleanSlug })),
  };
}
