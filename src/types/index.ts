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

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  profilePictureURL: string;
  fcmTokens: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
}
