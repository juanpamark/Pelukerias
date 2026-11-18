export type ServiceCategory = "Cortes" | "Barba" | "Combos" | "Cejas";

export type BookingStatus =
  | "confirmed"
  | "pending_verification"
  | "in_chair"
  | "completed"
  | "cancelled"
  | "no_show"
  | "blocked";

export interface PaymentAccount {
  bankName: "Nequi" | "Daviplata" | "Bancolombia" | "Llave Bre-B";
  accountNumber: string;
  accountHolder: string;
}

export interface PublicTenantDTO {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  address: string;
  district: string;
  city: string;
  isOpenNow: boolean;
  openHoursLabel: string;
  rating: number;
  reviewCount: number;
  bannerUrl: string;
  logoInitials: string;
  requireDeposit50: boolean;
  paymentAccounts: PaymentAccount[];
  whatsappNumberDisplay: string;
  closedWeekdays?: number[]; // 0=Dom .. 6=Sáb
  closedDates?: string[]; // YYYY-MM-DD fechas cerradas para todo el local
}

export interface PublicStaffDTO {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  workStart: string; // "09:00"
  workEnd: string; // "20:00"
  breakStart?: string; // "13:00"
  breakEnd?: string; // "14:00"
  isActive: boolean;
  restWeekdays?: number[]; // 0=Dom .. 6=Sáb
  restDates?: string[]; // YYYY-MM-DD días libres puntuales
}

export interface StaffServiceOverride {
  staffId: string;
  price: number;
  durationMinutes?: number;
}

export interface PublicServiceDTO {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  durationMinutes: number;
  basePrice: number;
  isPopular?: boolean;
  isActive: boolean;
  assignedStaffIds: string[];
  staffOverrides?: StaffServiceOverride[];
}

export interface BookingRecord {
  id: string;
  tenantSlug: string;
  staffId: string;
  serviceId: string;
  serviceName: string;
  staffName: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  totalPrice: number;
  depositRequired: boolean;
  depositAmount: number;
  receiptUrl?: string;
  status: BookingStatus;
  note?: string;
}

export interface TimeSlot {
  startTime: string; // "09:45"
  endTime: string; // "10:30"
  label: string; // "9:45 a. m."
  isOptimalPack: boolean; // True when tightly packed right after an existing booking (zero gap)
}
