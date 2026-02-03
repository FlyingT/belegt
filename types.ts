export interface Asset {
  id: string;
  name: string;
  type: string;
  description: string;
  color: string; // Hex code for UI identification
  is_maintenance: boolean;
  icon?: string; // Icon name from lucide-react
  sortOrder?: number;
  showKiosk?: boolean;
  hasCatering?: boolean;
  cateringOptions?: string[];
}

export interface Booking {
  id: string;
  assetId: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  userName: string;
  userEmail: string;
  department?: string;
  createdAt: string;
  catering?: Record<string, number>;
}

export interface AppConfig {
  headerText: string;
  siteTitle?: string;
  accentColor?: string;
  categoryIcons?: Record<string, string>; // Mapping type -> icon name
  placeholderTitle?: string;
  placeholderName?: string;
  placeholderEmail?: string;
  placeholderDepartment?: string;
}

export interface AdminState {
  isAuthenticated: boolean;
}

export enum AssetStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}