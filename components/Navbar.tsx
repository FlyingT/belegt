import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [headerText, setHeaderText] = useState('Buchungssystem');
  const [accentColor, setAccentColor] = useState('#3b82f6');

  useEffect(() => {
    api.getAppConfig().then(config => {
      setHeaderText(config.headerText);
      if (config.accentColor) setAccentColor(config.accentColor);
    });
  }, [location.pathname]); // Update text when navigating

  // Do not show navbar in Kiosk mode
  if (location.pathname.startsWith('/kiosk')) return null;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 font-bold text-xl" style={{ color: accentColor }}>
              <Calendar className="w-6 h-6" />
              <span>Belegt?</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`${location.pathname === '/'
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Übersicht
              </Link>
              <Link
                to="/admin"
                className={`${location.pathname.startsWith('/admin')
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Verwaltung
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-xs text-gray-400 mr-4 hidden md:block">
              {headerText}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};