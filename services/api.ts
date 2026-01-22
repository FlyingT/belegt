import { Asset, Booking, AppConfig } from '../types';

const ASSETS_KEY = 'rb_assets';
const BOOKINGS_KEY = 'rb_bookings';
const CONFIG_KEY = 'rb_config';

const INITIAL_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Konferenzraum A (Galaxy)',
    type: 'Room',
    description: 'Großer Meetingraum mit Beamer, 12 Plätze.',
    color: '#3b82f6',
    is_maintenance: false,
  },
  {
    id: '2',
    name: 'Konferenzraum B (Nebula)',
    type: 'Room',
    description: 'Kleiner Meetingraum, 4 Plätze, Whiteboard.',
    color: '#8b5cf6',
    is_maintenance: false,
  },
  {
    id: '3',
    name: 'Firmenwagen (Tesla Model 3)',
    type: 'Vehicle',
    description: 'Elektrofahrzeug, Reichweite 400km.',
    color: '#ef4444',
    is_maintenance: true,
  },
  {
    id: '4',
    name: 'Beamer Portable',
    type: 'Equipment',
    description: 'Tragbarer Beamer für externe Präsentationen.',
    color: '#10b981',
    is_maintenance: false,
  },
];

const INITIAL_BOOKINGS: Booking[] = [];

const INITIAL_CONFIG: AppConfig = {
  headerText: 'Buchungssystem',
};

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  initialize: () => {
    if (!localStorage.getItem(ASSETS_KEY)) {
      localStorage.setItem(ASSETS_KEY, JSON.stringify(INITIAL_ASSETS));
    }
    if (!localStorage.getItem(BOOKINGS_KEY)) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
    }
    if (!localStorage.getItem(CONFIG_KEY)) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(INITIAL_CONFIG));
    }
  },

  getAssets: async (): Promise<Asset[]> => {
    await delay(300);
    const data = localStorage.getItem(ASSETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getAssetById: async (id: string): Promise<Asset | undefined> => {
    await delay(200);
    const assets = JSON.parse(localStorage.getItem(ASSETS_KEY) || '[]');
    return assets.find((a: Asset) => a.id === id);
  },

  createAsset: async (assetData: Omit<Asset, 'id'>): Promise<Asset> => {
    await delay(300);
    const assets: Asset[] = JSON.parse(localStorage.getItem(ASSETS_KEY) || '[]');
    const newAsset: Asset = {
      ...assetData,
      id: Math.random().toString(36).substr(2, 9),
    };
    assets.push(newAsset);
    localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
    return newAsset;
  },

  updateAsset: async (asset: Asset): Promise<void> => {
    await delay(300);
    const assets: Asset[] = JSON.parse(localStorage.getItem(ASSETS_KEY) || '[]');
    const updated = assets.map((a) => (a.id === asset.id ? asset : a));
    localStorage.setItem(ASSETS_KEY, JSON.stringify(updated));
  },

  deleteAsset: async (id: string): Promise<void> => {
    await delay(300);
    const assets: Asset[] = JSON.parse(localStorage.getItem(ASSETS_KEY) || '[]');
    const updated = assets.filter((a) => a.id !== id);
    localStorage.setItem(ASSETS_KEY, JSON.stringify(updated));
  },

  toggleMaintenance: async (id: string, isMaintenance: boolean): Promise<void> => {
    await delay(300);
    const assets: Asset[] = JSON.parse(localStorage.getItem(ASSETS_KEY) || '[]');
    const updated = assets.map((a) => (a.id === id ? { ...a, is_maintenance: isMaintenance } : a));
    localStorage.setItem(ASSETS_KEY, JSON.stringify(updated));
  },

  getBookings: async (): Promise<Booking[]> => {
    await delay(300);
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    await delay(500);
    const bookings: Booking[] = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    
    // Simple overlap check
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();

    const hasOverlap = bookings
      .filter(b => b.assetId === booking.assetId)
      .some(b => {
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return (start < bEnd && end > bStart);
      });

    if (hasOverlap) {
      throw new Error("Dieser Zeitraum ist bereits belegt.");
    }

    const newBooking: Booking = {
      ...booking,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    
    // Mock Email Sending
    console.log(`[SMTP MOCK] Sending email to ${booking.userEmail}: Booking confirmed for Asset ${booking.assetId} from ${booking.startTime} to ${booking.endTime}`);

    return newBooking;
  },

  deleteBooking: async (id: string): Promise<void> => {
    await delay(300);
    const bookings: Booking[] = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    const updated = bookings.filter((b) => b.id !== id);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  },

  getAppConfig: async (): Promise<AppConfig> => {
    await delay(100);
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : INITIAL_CONFIG;
  },

  updateAppConfig: async (config: AppConfig): Promise<void> => {
    await delay(300);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },
};

// Initialize DB on load
api.initialize();