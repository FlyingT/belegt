import { useLocation, Link, Navigate } from 'react-router-dom';
import { Booking, AppConfig } from '../types';
import { downloadICS } from '../services/ics';
import { api } from '../services/api';
import { CheckCircle, Calendar, Home, Mail, Info } from 'lucide-react';

export const Confirmation: React.FC = () => {
  const location = useLocation();
  const state = location.state as { booking: Booking; assetName: string } | undefined;
  const [config, setConfig] = React.useState<AppConfig | null>(null);

  React.useEffect(() => {
    api.getAppConfig().then(setConfig).catch(console.error);
  }, []);

  if (!state) {
    return <Navigate to="/" />;
  }

  const { booking, assetName } = state;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden text-center transition-colors">
        <div className="bg-green-500 p-8 flex justify-center">
          <CheckCircle className="w-20 h-20 text-white" />
        </div>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Buchung erfolgreich!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Vielen Dank, {booking.userName}. Ihre Buchung für <strong>{assetName}</strong> wurde bestätigt.
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-8 text-left border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Titel/Grund:</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">{booking.title}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Zeitraum:</span>
              <span className="font-medium text-gray-900 dark:text-gray-200 text-sm">
                {new Date(booking.startTime).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Uhrzeit:</span>
              <span className="font-medium text-gray-900 dark:text-gray-200 text-sm">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {config?.mailEnabled ? (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 mb-4 flex items-start text-left">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-indigo-900 dark:text-indigo-200 text-sm">E-Mail wurde gesendet</h4>
                  <p className="text-indigo-700 dark:text-indigo-300 text-xs mt-1">
                    Eine Bestätigung inklusive Kalendereintrag wurde an <strong>{booking.userEmail}</strong> verschickt.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => downloadICS(booking, assetName)}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-colors shadow-sm"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Kalendereintrag herunterladen (.ics)
              </button>
            )}

            <Link
              to="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
