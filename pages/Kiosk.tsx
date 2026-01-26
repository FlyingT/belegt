import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Asset, Booking, AssetStatus } from '../types';
import { api } from '../services/api';
import { Clock, User, Calendar } from 'lucide-react';

export const Kiosk: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState<AssetStatus>(AssetStatus.FREE);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);

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

    // 2. Get Bookings
    const allBookings = await api.getBookings();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Filter for this asset and today
    const filtered = allBookings.filter(b => {
      const bDate = new Date(b.startTime).toISOString().split('T')[0];
      return b.assetId === assetId && bDate === todayStr;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    setTodaysBookings(filtered);

    // Find active booking
    const active = filtered.find(b => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return now >= start && now < end;
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

    // Combined interval for Clock and Data Refresh Countdown
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());

      setSecondsUntilRefresh(prev => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
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
    const until = new Date(currentBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    subText = `Bis ${until} Uhr: ${currentBooking.title}`;
  } else if (status === AssetStatus.MAINTENANCE) {
    bgColor = 'bg-gray-800';
    mainText = 'WARTUNG';
    subText = 'Dieses Asset ist derzeit außer Betrieb.';
  }

  return (
    <div className={`h-screen w-screen flex flex-col ${bgColor} text-white transition-colors duration-1000 overflow-hidden`}>
      {/* Header */}
      <div className="flex justify-between items-center p-8 bg-black bg-opacity-20 flex-shrink-0">
        <h1 className="text-4xl font-bold">{asset.name}</h1>
        <div className="flex items-center text-3xl font-mono">
          <Clock className="w-8 h-8 mr-4" />
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="bg-white bg-opacity-20 rounded-full px-12 py-4 backdrop-blur-sm mb-8">
          <span className="text-8xl font-black tracking-wider shadow-sm">{mainText}</span>
        </div>

        <p className="text-4xl font-light opacity-90">{subText}</p>

        {status === AssetStatus.OCCUPIED && currentBooking && (
          <div className="mt-12 flex items-center bg-black bg-opacity-30 px-8 py-4 rounded-xl">
            <User className="w-8 h-8 mr-4 opacity-80" />
            <div className="text-left">
              <div className="text-xl font-medium">{currentBooking.userName}</div>
            </div>
          </div>
        )}
      </div>

      {/* Today's Schedule (Bottom Panel) */}
      <div className="bg-black bg-opacity-40 p-6 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center mb-4 text-white opacity-80">
          <Calendar className="w-6 h-6 mr-2" />
          <span className="text-xl font-semibold">Tagesplan</span>
        </div>

        {todaysBookings.length === 0 ? (
          <p className="opacity-60">Keine weiteren Buchungen für heute.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todaysBookings.map(b => {
              const isCurrent = currentBooking && currentBooking.id === b.id;
              const isPast = new Date(b.endTime) < currentTime;

              return (
                <div key={b.id} className={`p-3 rounded-lg flex flex-col ${isCurrent ? 'bg-white bg-opacity-20 border border-white' : isPast ? 'bg-white bg-opacity-5 opacity-50' : 'bg-white bg-opacity-10'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-medium truncate">{b.title}</span>
                  <span className="text-sm opacity-70 truncate">{b.userName}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Line */}
      <div className="py-2 text-center text-xs opacity-40 bg-black bg-opacity-50">
        Kiosk Modus • Aktualisiert in {secondsUntilRefresh}s
      </div>
    </div>
  );
};