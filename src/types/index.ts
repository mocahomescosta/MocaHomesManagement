import { Timestamp } from 'firebase/firestore';

export type UserRole = 'Admin' | 'Manager' | 'Cleaner' | 'Technician';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UnitStatus = 'listo' | 'ocupado' | 'limpieza' | 'mantenimiento' | 'bloqueado';

export interface Address {
  street: string;
  number: string;
  city: string;
  zipCode: string;
  country: string;
  fullAddress: string;
}

export interface WifiInfo {
  name: string;
  password: string;
}

export interface AccessInfo {
  type: string;
  code: string;
}

export interface Unit {
  id: string;
  name: string;
  address: Address;
  type: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  sofaBed: boolean;
  hasTerrace: boolean;
  description: string;
  status: UnitStatus;
  mainImageURL: string;
  amenities: string[];
  wifiInfo: WifiInfo;
  accessInfo: AccessInfo;
  ownerIds: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type UnitFormData = Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>;

export type CleaningStatus = 'pendiente' | 'en_curso' | 'completada' | 'verificada' | 'incidencia';
export type CleaningType = 'checkout' | 'mantenimiento' | 'extra';

export interface ChecklistItem {
  id: string;
  name: string;
  area: string;
  order: number;
  completed: boolean;
  notes: string;
  photoURL?: string;
}

export interface CleaningAreaPhoto {
  area: string;
  photoURL: string;
  uploadedAt: string; // ISO string
}

export interface CleaningIssue {
  id: string;
  description: string;
  photoURL: string;
  reportedAt: Timestamp | null;
}

export interface Cleaning {
  id: string;
  unitId: string;
  unitName: string;
  assignedToId: string;
  assignedToName: string;
  type: CleaningType;
  status: CleaningStatus;
  scheduledDate: string;
  scheduledTime: string;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  checklist: ChecklistItem[];
  issues: CleaningIssue[];
  areaPhotos?: CleaningAreaPhoto[];
  notes: string;
  guestCheckout: string;
  guestCheckin: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type CleaningFormData = Omit<Cleaning, 'id' | 'createdAt' | 'updatedAt' | 'startedAt' | 'completedAt'>;

export type MaintenancePriority = 'baja' | 'media' | 'alta' | 'urgente';
export type MaintenanceStatus = 'abierta' | 'en_progreso' | 'esperando_material' | 'resuelta' | 'cancelada';
export type MaintenanceCategory = 'fontaneria' | 'electricidad' | 'electrodomestico' | 'muebles' | 'limpieza_profunda' | 'otro';

export interface MaintenancePhoto {
  id: string;
  url: string;
  uploadedAt: string;
}

export interface Maintenance {
  id: string;
  unitId: string;
  unitName: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedToId: string;
  assignedToName: string;
  reportedById: string;
  reportedByName: string;
  estimatedCost: number;
  actualCost: number;
  photos: MaintenancePhoto[];
  notes: string;
  resolvedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type MaintenanceFormData = Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt'>;

export type BookingStatus = 'booked' | 'tentative' | 'declined' | 'canceled' | 'open_bill';
export type BookingSource = 'airbnb' | 'booking' | 'vrbo' | 'direct' | 'other';

export interface Booking {
  id: string;
  lodgifyBookingId: string;
  lodgifyPropertyId: string;
  unitId: string;
  unitName: string;
  arrivalDate: string;    // "2026-06-10"
  departureDate: string;  // "2026-06-14"
  status: BookingStatus;
  source: BookingSource | string;
  guests: number;
  specialRequests: string;
  guestName: string;
  currencyCode: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type InventoryCategory = 'higiene' | 'cocina' | 'limpieza' | 'ropa_hogar' | 'otro';
export type StockLevel = 'ok' | 'bajo' | 'agotado';

export interface InventoryItem {
  id: string;
  unitId: string;
  unitName: string;
  name: string;
  category: InventoryCategory;
  currentStock: number;
  minStock: number;
  unit: string;
  stockLevel: StockLevel;
  notes: string;
  lastUpdatedById: string;
  lastUpdatedByName: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type InventoryItemFormData = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'stockLevel'>;

export type MaintenanceFrequency = 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';

export interface PeriodicMaintenance {
  id: string;
  unitId: string;
  unitName: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  frequency: MaintenanceFrequency;
  nextDate: Timestamp | any;
  lastCompletedDate: Timestamp | null;
  assignedToId: string;
  assignedToName: string;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  profilePictureURL: string;
  fcmTokens: string[];
  telegramChatId?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
}
