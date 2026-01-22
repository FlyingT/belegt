import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Asset, Booking, AssetStatus } from '../types';
import { api } from '../services/api';
import { Clock, User } from 'lucide-react';

export const Kiosk: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState<AssetStatus>(AssetStatus.FREE);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = async () => {
    if (!assetId) return;
    
    // 1. Get Asset
    const assetData = await api.getAssetById(assetId);
    if (!assetData) return;
    setAsset(assetData);

    if (assetData.is_maintenance) {
      setStatus(AssetStatus.MAINTENANCE);
      return;
    }

    // 2. Get Bookings and check occupancy
    const bookings = await api.getBookings();
    const now = new Date();
    
    // Find active booking
    const active = bookings.find(b => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return b.assetId === assetId && now >= start && now < end;
    });

    if (active) {
      setCurrentBooking(active);
      setStatus(AssetStatus.OCCUPIED);
    } else {
      setCurrentBooking(null);
      setStatus(AssetStatus.FREE);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh Data every 60s
    const dataInterval = setInterval(fetchData, 60000);
    // Refresh Clock every 1s
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(clockInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  if (!asset) return <div className="h-screen w-screen bg-black text-white flex items-center justify-center">Lade Kiosk...</div>;

  // Render logic based on status
  let bgColor = 'bg-green-600';
  let mainText = 'FREI';
  let subText = 'Derzeit keine Buchungen';

  if (status === AssetStatus.OCCUPIED && currentBooking) {
    bgColor = 'bg-red-600';
    mainText = 'BELEGT';
    const until = new Date(currentBooking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    subText = `Bis ${until} Uhr`;
  } else if (status === AssetStatus.MAINTENANCE) {
    bgColor = 'bg-gray-800';
    mainText = 'WARTUNG';
    subText = 'Dieses Asset ist derzeit außer Betrieb.';
  }

  return (
    <div className={`h-screen w-screen flex flex-col ${bgColor} text-white transition-colors duration-1000`}>
      {/* Header */}
      <div className="flex justify-between items-center p-8 bg-black bg-opacity-20">
        <h1 className="text-4xl font-bold">{asset.name}</h1>
        <div className="flex items-center text-3xl font-mono">
          <Clock className="w-8 h-8 mr-4" />
          {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="bg-white bg-opacity-20 rounded-full px-12 py-4 backdrop-blur-sm mb-12">
          <span className="text-8xl font-black tracking-wider shadow-sm">{mainText}</span>
        </div>
        
        <p className="text-4xl font-light opacity-90">{subText}</p>

        {status === AssetStatus.OCCUPIED && currentBooking && (
          <div className="mt-16 flex items-center bg-black bg-opacity-30 px-8 py-4 rounded-xl">
             <User className="w-8 h-8 mr-4 opacity-80" />
             <span className="text-2xl font-medium">{currentBooking.userName}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-sm opacity-50">
         Kiosk Mode • Refreshing every 60s
      </div>
    </div>
  );
};