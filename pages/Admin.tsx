import React, { useEffect, useState } from 'react';
import { Asset, Booking, AppConfig } from '../types';
import { api } from '../services/api';
import { Trash2, Power, LogOut, Save, Settings, Plus, Edit2, X, RefreshCw, ArrowUp, ArrowDown, RotateCcw, Download, Upload, Coffee, Layout, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { DynamicIcon, ICON_MAP } from '../utils/iconMap';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Data State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'assets' | 'bookings' | 'settings'>('assets');

  // Settings State
  const [config, setConfig] = useState<AppConfig>({ headerText: '', categoryIcons: {} });
  const [savingConfig, setSavingConfig] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Asset Edit State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Partial<Asset>>({});

  // Import State
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = ((window as any)._env_ && (window as any)._env_.ADMIN_USER) || 'admin';
    const envPass = ((window as any)._env_ && (window as any)._env_.ADMIN_PASSWORD) || 'belegt';

    if (username === envUser && password === envPass) {
      setIsAuthenticated(true);
      loadData();
    } else {
      alert('Falsche Zugangsdaten');
    }
  };

  const loadData = async () => {
    const a = await api.getAssets();
    const b = await api.getBookings();
    const c = await api.getAppConfig();
    setAssets(a);
    setBookings(b.sort((x: Booking, y: Booking) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()));
    setConfig(c);
  };

  // Helper: Random Color
  const getRandomColor = () => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
      '#6366f1', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Asset Management
  const openNewAssetModal = () => {
    setEditingAsset({
      name: '',
      type: 'Room',
      description: '',
      color: getRandomColor(),
      is_maintenance: false,
      icon: '',
      showKiosk: true,
      hasCatering: false,
      cateringOptions: []
    });
    setIsAssetModalOpen(true);
  };

  const openEditAssetModal = (asset: Asset) => {
    setEditingAsset({ ...asset });
    setIsAssetModalOpen(true);
  };

  const saveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset.name || !editingAsset.type) {
      alert('Bitte Namen und Typ angeben.');
      return;
    }

    if (editingAsset.id) {
      await api.updateAsset(editingAsset as Asset);
    } else {
      await api.createAsset(editingAsset as Omit<Asset, 'id'>);
    }
    setIsAssetModalOpen(false);
    loadData();
  };

  const deleteAsset = async (id: string) => {
    if (window.confirm('Asset wirklich löschen? Alle zugehörigen Buchungen bleiben bestehen, aber das Asset verschwindet.')) {
      await api.deleteAsset(id);
      loadData();
    }
  };

  const toggleMaintenance = async (asset: Asset) => {
    await api.toggleMaintenance(asset.id, !asset.is_maintenance);
    loadData();
  };

  const moveAsset = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === assets.length - 1)) {
      return;
    }

    const newAssets = [...assets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap
    [newAssets[index], newAssets[targetIndex]] = [newAssets[targetIndex], newAssets[index]];

    setAssets(newAssets); // Optimistic UI update
    await api.reorderAssets(newAssets); // Persist
  };

  // Bookings Management
  const deleteBooking = async (id: string) => {
    if (window.confirm('Buchung wirklich löschen?')) {
      await api.deleteBooking(id);
      loadData();
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    await api.updateAppConfig(config);
    setSavingConfig(false);
    // Reload to reflect changes immediately (e.g. title, buttons)
    window.location.reload();
  };

  const handleTestMail = async () => {
    if (!testRecipient) {
      setTestStatus({ type: 'error', message: 'Bitte Empfänger-Email angeben.' });
      return;
    }
    setTestLoading(true);
    setTestStatus(null);
    try {
      await api.sendTestMail({
        ...config,
        testRecipient
      });
      setTestStatus({ type: 'success', message: 'Test-Mail erfolgreich versendet!' });
    } catch (err: any) {
      setTestStatus({ type: 'error', message: err.message || 'Fehler beim Versenden.' });
    } finally {
      setTestLoading(false);
    }
  };

  // Helper for Category Icons Setting
  const handleCategoryIconChange = (type: string, iconName: string) => {
    setConfig((prev: AppConfig) => ({
      ...prev,
      categoryIcons: {
        ...prev.categoryIcons,
        [type]: iconName
      }
    }));
  };

  const resetCategoryIcon = (type: string) => {
    const newIcons = { ...config.categoryIcons };
    delete newIcons[type];
    setConfig((prev: AppConfig) => ({
      ...prev,
      categoryIcons: newIcons
    }));
  };

  // Mappings for UI
  const categoryLabels: Record<string, string> = {
    'Room': 'Räume',
    'Vehicle': 'Fahrzeuge',
    'Equipment': 'Ausrüstung',
    'Other': 'Sonstiges'
  };

  // Default icons to display if nothing is selected (Matches Dashboard logic)
  const defaultIcons: Record<string, string> = {
    'Room': 'Users',
    'Vehicle': 'Truck',
    'Equipment': 'Box',
    'Other': 'Wrench'
  };

  // Export / Import
  const handleExport = () => {
    const dataStr = JSON.stringify(bookings, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Importierte Buchungen werden hinzugefügt. Bestehende Buchungen bleiben erhalten. Fortfahren?')) {
      e.target.value = ''; // Reset input
      return;
    }

    setImporting(true);
    setImportProgress('Lese Datei...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const importedBookings = JSON.parse(json);

        if (!Array.isArray(importedBookings)) {
          throw new Error('Ungültiges Format: Keine Liste gefunden.');
        }

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < importedBookings.length; i++) {
          const b = importedBookings[i];
          setImportProgress(`Importiere ${i + 1} von ${importedBookings.length}...`);

          try {
            // Validate basic fields
            if (!b.assetId || !b.title || !b.startTime || !b.endTime) {
              console.warn('Skipping invalid booking:', b);
              errorCount++;
              continue;
            }

            await api.createBooking({
              assetId: b.assetId,
              title: b.title,
              startTime: b.startTime,
              endTime: b.endTime,
              userName: b.userName || 'Imported',
              userEmail: b.userEmail || 'imported@system',
              department: b.department || '',
              catering: b.catering || {}
            });
            successCount++;
          } catch (err) {
            console.error('Failed to import booking:', b, err);
            errorCount++;
          }
        }

        alert(`Import abgeschlossen.\nErfolgreich: ${successCount}\nFehler/Übersprungen: ${errorCount}`);
        loadData();
      } catch (err: any) {
        alert('Fehler beim Import: ' + err.message);
      } finally {
        setImporting(false);
        setImportProgress('');
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Helper: Date Categories
  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayBookings = bookings.filter((b: Booking) => isSameDate(new Date(b.startTime), now)).sort((a: Booking, b: Booking) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const upcomingBookings = bookings.filter((b: Booking) => new Date(b.startTime) >= new Date(today.getTime() + 24 * 60 * 60 * 1000)).sort((a: Booking, b: Booking) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const pastBookings = bookings.filter((b: Booking) => new Date(b.startTime) < today).sort((a: Booking, b: Booking) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // Descending for past

  const getTodayStatusStyle = (b: Booking) => {
    const start = new Date(b.startTime).getTime();
    const end = new Date(b.endTime).getTime();
    const current = now.getTime();

    if (current > end) return 'text-gray-400 opacity-75'; // Past
    if (current >= start && current <= end) return 'font-bold text-indigo-900 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-100'; // Active
    return 'text-gray-900 dark:text-gray-300'; // Future
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md border dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Admin Anmeldung</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors">Anmelden</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verwaltung</h1>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="flex items-center text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
        >
          <LogOut className="w-5 h-5 mr-2" /> Abmelden
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex">
          <button
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'assets' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('assets')}
          >
            Ressourcen
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'bookings' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('bookings')}
          >
            Buchungen
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('settings')}
          >
            Einstellungen
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'assets' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={openNewAssetModal}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" /> Neue Ressource
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-10">Sortierung</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Typ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gesamtnutzung</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {assets.map((asset, index) => (
                      <tr key={asset.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => moveAsset(index, 'up')}
                              disabled={index === 0}
                              className={`text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-500 dark:text-gray-400 dark:hover:text-indigo-400`}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveAsset(index, 'down')}
                              disabled={index === assets.length - 1}
                              className={`text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-500 dark:text-gray-400 dark:hover:text-indigo-400`}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: asset.color }}></span>
                          <span className="mr-2 text-gray-500 dark:text-gray-400"><DynamicIcon name={asset.icon} className="w-4 h-4" /></span>
                          {asset.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{categoryLabels[asset.type] || asset.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${asset.is_maintenance ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                            {asset.is_maintenance ? 'In Wartung' : 'Verfügbar'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {bookings.filter(b => b.assetId === asset.id).length} Buchungen
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => toggleMaintenance(asset)}
                            className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white ${asset.is_maintenance ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                            title={asset.is_maintenance ? 'Aktivieren' : 'In Wartung setzen'}
                          >
                            <Power className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => openEditAssetModal(asset)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                            title="Bearbeiten"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteAsset(asset.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
                            title="Löschen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <div className="flex justify-end mb-4 space-x-2">
                <button
                  onClick={handleExport}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" /> Exportieren
                </button>
                <a
                  href="/info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center transition-colors"
                >
                  <Layout className="w-4 h-4 mr-2" /> Öffentliche Übersicht
                </a>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={importing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <button
                    className={`bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center ${importing ? 'opacity-50' : ''}`}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {importing ? importProgress : 'Importieren'}
                  </button>
                </div>
              </div>

              {/* Tagesübersicht */}
              <div className="mb-8">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">Tagesübersicht (Heute)</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ressource</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Titel / Nutzer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catering</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zeitraum</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {todayBookings.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Keine Buchungen für heute.</td></tr>
                      ) : (
                        todayBookings.map(b => {
                          const rowClass = getTodayStatusStyle(b);
                          return (
                            <tr key={b.id} className={rowClass}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-gray-200">
                                {assets.find(a => a.id === b.assetId)?.name || b.assetId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">
                                <div className="font-bold">{b.title}</div>
                                {b.userName} <span className="text-xs">({b.userEmail})</span>
                                {b.department && <div className="text-xs text-gray-500 dark:text-gray-400">{b.department}</div>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {b.catering && Object.entries(b.catering).length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(b.catering).filter(([_, qty]) => (qty as number) > 0).map(([item, qty]: [string, unknown]) => (
                                      <span key={item} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50">
                                        {item}: {qty as number}
                                      </span>
                                    ))}
                                    {b.costCenter && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50">
                                        Kostenstelle: {b.costCenter}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => deleteBooking(b.id)} className="text-red-600 hover:text-red-900" title="Löschen"><Trash2 className="w-5 h-5" /></button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Anstehend */}
              <div className="mb-8">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">Anstehend (ab Morgen)</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Datum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ressource</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Titel / Nutzer / Abteilung</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catering</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zeit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {upcomingBookings.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Keine anstehenden Buchungen.</td></tr>
                      ) : (
                        upcomingBookings.map((b: Booking) => (
                          <tr key={b.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(b.startTime).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{assets.find(a => a.id === b.assetId)?.name || b.assetId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                              <div className="text-indigo-700 dark:text-indigo-400">{b.title}</div>
                              {b.userName}
                              {b.department && <div className="text-xs text-gray-500 dark:text-gray-400">{b.department}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {b.catering && Object.entries(b.catering).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(b.catering).filter(([_, qty]) => (qty as number) > 0).map(([item, qty]: [string, unknown]) => (
                                    <span key={item} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50">
                                      {item}: {qty as number}
                                    </span>
                                  ))}
                                  {b.costCenter && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50">
                                      Kostenstelle: {b.costCenter}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => deleteBooking(b.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vergangen */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">Vergangen</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Datum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ressource</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Titel / Nutzer / Abteilung</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catering</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zeit</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aktion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {pastBookings.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Keine vergangenen Buchungen.</td></tr>
                      ) : (
                        pastBookings.map((b: Booking) => (
                          <tr key={b.id} className="opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(b.startTime).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{assets.find(a => a.id === b.assetId)?.name || b.assetId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                              <div>{b.title}</div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{b.userName}</span>
                              {b.department && <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">({b.department})</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {b.catering && Object.entries(b.catering).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(b.catering).filter(([_, qty]) => (qty as number) > 0).map(([item, qty]: [string, unknown]) => (
                                    <span key={item} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                      {item}: {qty as number}
                                    </span>
                                  ))}
                                  {b.costCenter && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                      Kostenstelle: {b.costCenter}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => deleteBooking(b.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl">
              <form onSubmit={saveSettings} className="space-y-8">

                {/* General */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-4">Allgemein</h4>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">System Name (Header Text)</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Settings className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                          value={config.headerText}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, headerText: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seitentitel (Browser Tab)</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Settings className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                          value={config.siteTitle || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, siteTitle: e.target.value })}
                          placeholder="Belegt"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Akzentfarbe (Titel & Buttons)</label>
                      <div className="flex gap-2 items-center mt-1">
                        <input
                          type="color"
                          className="h-10 w-44 p-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm cursor-pointer bg-white dark:bg-gray-700"
                          value={config.accentColor || '#3b82f6'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, accentColor: e.target.value })}
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{config.accentColor || '#3b82f6'}</span>
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, accentColor: '#3b82f6' })}
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 ml-2"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={saveSettings}
                      disabled={savingConfig}
                      className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${savingConfig ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Speichern & Neuladen
                    </button>
                  </div>
                </div>

                {/* E-Mail Notifications */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-200">E-Mail Benachrichtigungen</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Versenden Sie automatische Bestätigungs-Mails nach jeder Buchung.</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={config.mailEnabled || false}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, mailEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{config.mailEnabled ? 'Aktiviert' : 'Deaktiviert'}</span>
                      </label>
                    </div>
                  </div>

                  {config.mailEnabled && (
                    <div className="space-y-4 max-w-2xl mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Host</label>
                          <input
                            type="text"
                            placeholder="smtp.example.com"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                            value={config.mailHost || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, mailHost: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Port</label>
                          <input
                            type="number"
                            placeholder="587"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                            value={config.mailPort || 587}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, mailPort: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Benutzer</label>
                          <input
                            type="text"
                            placeholder="benutzer@example.com"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                            value={config.mailUser || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, mailUser: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Passwort</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                            value={config.mailPass || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, mailPass: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Opening Hours Extension */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-200">Öffnungszeiten-Erweiterung</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ermöglichen Sie Nutzern, eine Türöffnung außerhalb der regulären Zeiten anzufragen.</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={config.doorExtensionEnabled || false}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, doorExtensionEnabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{config.doorExtensionEnabled ? 'Aktiviert' : 'Deaktiviert'}</span>
                      </label>
                    </div>
                  </div>

                  {config.doorExtensionEnabled && (
                    <div className="space-y-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mail an</label>
                        <input
                          type="email"
                          placeholder="pforte@example.com"
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                          value={config.doorExtensionMail || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, doorExtensionMail: e.target.value })}
                        />
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Erweiterte Türöffnung anbieten?</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {assets.filter(a => a.type === 'Room').map(asset => (
                            <div key={asset.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mr-2">{asset.name}</span>
                              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={asset.doorExtensionOffered || false}
                                  onChange={async (e) => {
                                    const updatedAsset = { ...asset, doorExtensionOffered: e.target.checked };
                                    setAssets(assets.map(a => a.id === asset.id ? updatedAsset : a));
                                    await api.updateAsset(updatedAsset);
                                  }}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Placeholders */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-4">Buchungsformular: Platzhalter</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Definieren Sie, was als Platzhalter in den Eingabefeldern der Buchungsmaske angezeigt werden soll.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titel der Buchung</label>
                      <input
                        type="text"
                        placeholder="z.B. Team-Meeting"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                        value={config.placeholderTitle || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, placeholderTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name des Nutzers</label>
                      <input
                        type="text"
                        placeholder="z.B. Max Mustermann"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                        value={config.placeholderName || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, placeholderName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-Mail Adresse</label>
                      <input
                        type="email"
                        placeholder="z.B. max@firma.de"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                        value={config.placeholderEmail || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, placeholderEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Abteilung / Team</label>
                      <input
                        type="text"
                        placeholder="z.B. Marketing"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                        value={config.placeholderDepartment || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, placeholderDepartment: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Test Mail Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-4">E-Mail Einstellungen testen</h4>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Empfänger für Test-Mail"
                      className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                      value={testRecipient}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestRecipient(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleTestMail}
                      disabled={testLoading}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${testLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none`}
                    >
                      {testLoading ? 'Sende...' : 'Test-Mail senden'}
                      {!testLoading && <Mail className="ml-2 w-4 h-4" />}
                    </button>
                  </div>
                  {testStatus && (
                    <div className={`mt-3 flex items-center text-sm ${testStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {testStatus.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                      {testStatus.message}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-5">
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className={`inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${savingConfig ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savingConfig ? 'Speichere...' : 'Einstellungen speichern & Neuladen'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platzhalter für "Titel / Grund"</label>
              <input
                type="text"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                value={config.placeholderTitle || ''}
                placeholder="z.B. Team Meeting, Kundenbesuch"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, placeholderTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platzhalter für "Name"</label>
              <input
                type="text"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                value={config.placeholderName || ''}
                placeholder="z.B. Max Mustermann"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, placeholderName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platzhalter für "Abteilung"</label>
              <input
                type="text"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                value={config.placeholderDepartment || ''}
                placeholder="z.B. IT, Vertrieb"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, placeholderDepartment: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platzhalter für "E-Mail"</label>
              <input
                type="text"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md border p-2"
                value={config.placeholderEmail || ''}
                placeholder="z.B. max@firma.de"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, placeholderEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveSettings}
              disabled={savingConfig}
              className={`inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${savingConfig ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              <Save className="w-4 h-4 mr-2" />
              Speichern & Neuladen
            </button>
          </div>
        </div>

        {/* Category Icons */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-4">Kategorie Icons</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Wählen Sie Standard-Icons für die verschiedenen Ressourcentypen.</p>

          <div className="space-y-8">
            {Object.entries(categoryLabels).map(([type, label]) => {
              const currentIcon = config.categoryIcons?.[type];
              const activeIcon = currentIcon || defaultIcons[type];

              return (
                <div key={type} className="border-b border-gray-200 dark:border-gray-600 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-base font-semibold text-gray-800 dark:text-gray-200">{label}</label>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                        Aktives Icon:
                        <span className="inline-flex items-center ml-2 bg-white dark:bg-gray-600 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100">
                          <DynamicIcon name={activeIcon} className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                          {activeIcon}
                        </span>
                        {!currentIcon && <span className="ml-2 text-gray-400 dark:text-gray-500 italic">(Standard)</span>}
                      </div>
                    </div>
                    {currentIcon && (
                      <button
                        type="button"
                        onClick={() => resetCategoryIcon(type)}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Zurücksetzen
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-48 overflow-y-auto border p-3 rounded-md bg-white">
                    {Object.keys(ICON_MAP).map((iconName: string) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => handleCategoryIconChange(type, iconName)}
                        className={`p-2 rounded flex flex-col items-center justify-center hover:bg-gray-100 transition-colors ${currentIcon === iconName
                          ? 'bg-indigo-100 border border-indigo-500 ring-1 ring-indigo-500'
                          : (!currentIcon && iconName === defaultIcons[type])
                            ? 'bg-gray-100 border border-gray-300 opacity-75'
                            : ''
                          }`}
                        title={iconName}
                      >
                        <DynamicIcon name={iconName} className={`w-5 h-5 ${currentIcon === iconName ? 'text-indigo-700' : 'text-gray-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </form >
    </div >
  )
}


{/* Asset Modal */ }
{
  isAssetModalOpen && (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsAssetModalOpen(false)}></div>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => setIsAssetModalOpen(false)}
            >
              <span className="sr-only">Schließen</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
            {editingAsset.id ? 'Ressource bearbeiten' : 'Neue Ressource anlegen'}
          </h3>

          <form onSubmit={saveAsset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={editingAsset.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingAsset({ ...editingAsset, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Typ</label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={editingAsset.type || 'Room'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingAsset({ ...editingAsset, type: e.target.value })}
              >
                <option value="Room">Raum</option>
                <option value="Vehicle">Fahrzeug</option>
                <option value="Equipment">Ausrüstung</option>
                <option value="Other">Sonstiges</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
              <textarea
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={editingAsset.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingAsset({ ...editingAsset, description: e.target.value })}
              />
            </div>

            {/* Color & Maintenance */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farbe
                  <button type="button" onClick={() => setEditingAsset({ ...editingAsset, color: getRandomColor() })} className="ml-2 text-xs text-indigo-600 hover:underline"><RefreshCw className="inline w-3 h-3" /> Zufall</button>
                </label>
                <input
                  type="color"
                  className="block w-full h-10 p-0 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={editingAsset.color || '#3b82f6'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingAsset({ ...editingAsset, color: e.target.value })}
                />
              </div>
              <div className="flex items-center h-10 pb-3">
                <input
                  id="maintenance_toggle"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={editingAsset.is_maintenance || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingAsset({ ...editingAsset, is_maintenance: e.target.checked })}
                />
                <label htmlFor="maintenance_toggle" className="ml-2 block text-sm text-gray-900">
                  In Wartung?
                </label>
              </div>
              <div className="flex items-center h-10 pb-3 ml-4">
                <input
                  id="kiosk_toggle"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={editingAsset.showKiosk !== false} // Default true
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingAsset({ ...editingAsset, showKiosk: e.target.checked })}
                />
                <label htmlFor="kiosk_toggle" className="ml-2 block text-sm text-gray-900">
                  Kiosk-Ansicht?
                </label>
              </div>
            </div>

            {/* Catering Configuration */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center mb-4">
                <input
                  id="catering_toggle"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={editingAsset.hasCatering || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingAsset({
                    ...editingAsset,
                    hasCatering: e.target.checked,
                    cateringOptions: e.target.checked ? (editingAsset.cateringOptions || ['']) : []
                  })}
                />
                <label htmlFor="catering_toggle" className="ml-2 block text-sm font-medium text-gray-900">
                  Catering oder Arbeitsmittel?
                </label>
              </div>

              {editingAsset.hasCatering && (
                <div className="space-y-3 ml-6">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Hinzubuchbare Optionen</label>
                  {(editingAsset.cateringOptions || []).map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="z.B. Kaffee, Flipchart..."
                        className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={option}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newOptions = [...(editingAsset.cateringOptions || [])];
                          newOptions[idx] = e.target.value;
                          setEditingAsset({ ...editingAsset, cateringOptions: newOptions });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = (editingAsset.cateringOptions || []).filter((_, i) => i !== idx);
                          setEditingAsset({ ...editingAsset, cateringOptions: newOptions });
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditingAsset({
                      ...editingAsset,
                      cateringOptions: [...(editingAsset.cateringOptions || []), '']
                    })}
                    className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-3 h-3 mr-1" /> weiteres Feld hinzufügen
                  </button>

                  <div className="mt-4 flex items-center pt-2 border-t border-gray-100">
                    <input
                      id="cost_center_toggle"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={editingAsset.costCenterRequired || false}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingAsset({
                        ...editingAsset,
                        costCenterRequired: e.target.checked
                      })}
                    />
                    <label htmlFor="cost_center_toggle" className="ml-2 block text-sm text-gray-700">
                      Kostenstelle nötig?
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                {Object.keys(ICON_MAP).map(iconName => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setEditingAsset({ ...editingAsset, icon: iconName })}
                    className={`p-2 rounded flex flex-col items-center justify-center hover:bg-gray-100 ${editingAsset.icon === iconName ? 'bg-indigo-100 border border-indigo-500' : ''}`}
                    title={iconName}
                  >
                    <DynamicIcon name={iconName} className="w-5 h-5 text-gray-700" />
                  </button>
                ))}
              </div>
              {editingAsset.icon && <div className="text-xs text-gray-500 mt-1">Ausgewählt: {editingAsset.icon}</div>}
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Speichern
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setIsAssetModalOpen(false)}
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
        </div >
      </div >
    </div >
  );
};