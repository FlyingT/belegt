import { Asset, Booking, AppConfig } from '../types';

export const api = {
  getAssets: async (): Promise<Asset[]> => {
    const res = await fetch('/api/assets');
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  getAssetById: async (id: string): Promise<Asset | undefined> => {
    const assets = await api.getAssets();
    return assets.find(a => a.id === id);
  },

  createAsset: async (assetData: Omit<Asset, 'id'>): Promise<Asset> => {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetData),
    });
    if (!res.ok) throw new Error('Failed to create asset');
    return res.json();
  },

  updateAsset: async (asset: Asset): Promise<void> => {
    await fetch(`/api/assets/${asset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    });
  },

  reorderAssets: async (assets: Asset[]): Promise<void> => {
    // Send list of {id, sortOrder}
    const payload = assets.map((a, index) => ({ id: a.id, sortOrder: index }));
    await fetch('/api/assets/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  deleteAsset: async (id: string): Promise<void> => {
    await fetch(`/api/assets/${id}`, { method: 'DELETE' });
  },

  toggleMaintenance: async (id: string, isMaintenance: boolean): Promise<void> => {
    await fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_maintenance: isMaintenance }),
    });
  },

  getBookings: async (): Promise<Booking[]> => {
    const res = await fetch('/api/bookings');
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    
    if (res.status === 409) {
      const err = await res.json();
      throw new Error(err.error || 'Conflict');
    }
    
    if (!res.ok) throw new Error('Failed to create booking');
    return res.json();
  },

  deleteBooking: async (id: string): Promise<void> => {
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
  },

  getAppConfig: async (): Promise<AppConfig> => {
    const res = await fetch('/api/config');
    if (!res.ok) return { headerText: 'Buchungssystem' };
    return res.json();
  },

  updateAppConfig: async (config: AppConfig): Promise<void> => {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },
};