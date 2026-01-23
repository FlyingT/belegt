export interface Asset {
  id: string;
  name: string;
  type: string;
  description: string;
  color: string; // Hex code for UI identification
  is_maintenance: boolean;
  icon?: string; // Icon name from lucide-react
}

export interface Booking {
  id: string;
  assetId: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  userName: string;
  userEmail: string;
  createdAt: string;
}

export interface AppConfig {
  headerText: string;
  categoryIcons?: Record<string, string>; // Mapping type -> icon name
}

export interface AdminState {
  isAuthenticated: boolean;
}

export enum AssetStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}