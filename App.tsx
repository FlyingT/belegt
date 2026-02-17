import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { BookingFlow } from './pages/BookingFlow';
import { Confirmation } from './pages/Confirmation';
import { Kiosk } from './pages/Kiosk';
import { Admin } from './pages/Admin';
import PublicOverview from './pages/PublicOverview';
import { api } from './services/api';

const Layout = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <footer className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 text-xs text-right py-1 px-4 border-t border-gray-300 dark:border-gray-700">
      <a href="https://github.com/FlyingT/belegt/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="hover:underline">
        v1.12.0 von TK
      </a>
    </footer>
  </div>
);

const App: React.FC = () => {
  useEffect(() => {
    // Set dynamic title
    api.getAppConfig().then(config => {
      if (config && config.siteTitle) {
        document.title = config.siteTitle;
      }
    }).catch(err => console.error("Failed to load title config", err));
  }, []);

  return (
    <Router>
      <Routes>
        {/* Kiosk Route (No Layout) */}
        <Route path="/kiosk/:assetId" element={<Kiosk />} />

        {/* Main Routes (With Layout) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/book/:assetId" element={<BookingFlow />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/info" element={<PublicOverview />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;