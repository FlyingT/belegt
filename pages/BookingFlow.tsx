import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Asset, Booking } from '../types';
import { api } from '../services/api';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Mail, AlertCircle, Type, Info } from 'lucide-react';

export const BookingFlow: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    title: '',
    name: '',
    email: ''
  });

  useEffect(() => {
    if (assetId) {
      Promise.all([
        api.getAssetById(assetId),
        api.getBookings()
      ]).then(([assetData, bookingsData]) => {
        if (!assetData) {
          navigate('/');
          return;
        }
        setAsset(assetData);
        // Filter bookings for this asset
        setExistingBookings(bookingsData.filter(b => b.assetId === assetId));
        setLoading(false);
      });
    }
  }, [assetId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setError(null);
    setSubmitting(true);

    try {
      // Construct ISO strings
      const startIso = `${formData.date}T${formData.startTime}:00`;
      const endIso = `${formData.date}T${formData.endTime}:00`;

      if (new Date(startIso) >= new Date(endIso)) {
        throw new Error("Endzeit muss nach der Startzeit liegen.");
      }

      if (new Date(startIso) < new Date()) {
         throw new Error("Buchungen in der Vergangenheit sind nicht erlaubt.");
      }

      const booking = await api.createBooking({
        assetId: asset.id,
        title: formData.title,
        startTime: startIso,
        endTime: endIso,
        userName: formData.name,
        userEmail: formData.email
      });

      // Navigate to confirmation with state
      navigate('/confirmation', { state: { booking, assetName: asset.name } });

    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter bookings for the selected date
  const bookingsForDate = existingBookings.filter(b => {
    const bookingDate = new Date(b.startTime).toISOString().split('T')[0];
    return bookingDate === formData.date;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (loading || !asset) return <div className="p-8 text-center">Laden...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zur Übersicht
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Main Form */}
        <div className="flex-1">
          <div className="bg-indigo-600 p-6 text-white">
            <h2 className="text-2xl font-bold">Buchung: {asset.name}</h2>
            <p className="opacity-90 mt-1">{asset.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700">Titel / Grund der Buchung</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Team Meeting, Kundenbesuch"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md border p-2"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 pb-2 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Zeitwahl
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Datum</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Von</label>
                    <input
                      type="time"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bis</label>
                    <input
                      type="time"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 pb-2 flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-500" /> Ihre Daten
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md border p-2"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-Mail Adresse</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        required
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md border p-2"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end">
               <button
                type="submit"
                disabled={submitting}
                className={`inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  submitting ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
               >
                 {submitting ? 'Wird gebucht...' : 'Jetzt Buchen'}
               </button>
            </div>
          </form>
        </div>
        
        {/* Availability Sidebar */}
        <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 w-full md:w-72 p-6">
           <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
             <Info className="w-4 h-4 mr-2" /> Belegung am {new Date(formData.date).toLocaleDateString()}
           </h3>
           
           {bookingsForDate.length === 0 ? (
             <p className="text-sm text-gray-500 italic">Noch keine Buchungen für diesen Tag.</p>
           ) : (
             <div className="space-y-3">
               {bookingsForDate.map(b => (
                 <div key={b.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                    <div className="text-xs font-semibold text-indigo-600 mb-1">
                      {new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-sm font-medium text-gray-800 truncate" title={b.title}>{b.title}</div>
                    <div className="text-xs text-gray-500 truncate">{b.userName}</div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};