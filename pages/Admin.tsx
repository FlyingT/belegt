import React, { useEffect, useState } from 'react';
import { Asset, Booking, AppConfig } from '../types';
import { api } from '../services/api';
import { Trash2, Power, LogOut, Save, Settings, Plus, Edit2, X, RefreshCw } from 'lucide-react';
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

  // Asset Edit State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Partial<Asset>>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = (window._env_ && window._env_.ADMIN_USER) || 'admin';
    const envPass = (window._env_ && window._env_.ADMIN_PASSWORD) || 'belegt';

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
    setBookings(b.sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()));
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
      icon: ''
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
    alert('Einstellungen wurden gespeichert.');
  };

  // Helper for Category Icons Setting
  const handleCategoryIconChange = (type: string, iconName: string) => {
    setConfig(prev => ({
      ...prev,
      categoryIcons: {
        ...prev.categoryIcons,
        [type]: iconName
      }
    }));
  };

  // Mappings for UI
  const categoryLabels: Record<string, string> = {
    'Room': 'Räume',
    'Vehicle': 'Fahrzeuge',
    'Equipment': 'Ausrüstung',
    'Other': 'Sonstiges'
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Anmeldung</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Benutzername</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passwort</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Anmelden</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Verwaltung</h1>
        <button 
          onClick={() => setIsAuthenticated(false)} 
          className="flex items-center text-gray-500 hover:text-red-600"
        >
          <LogOut className="w-5 h-5 mr-2" /> Abmelden
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 flex">
          <button 
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'assets' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('assets')}
          >
            Ressourcen
          </button>
          <button 
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'bookings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('bookings')}
          >
            Buchungen
          </button>
          <button 
            className={`flex-1 py-4 text-center font-medium ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assets.map(asset => (
                      <tr key={asset.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: asset.color }}></span>
                          <span className="mr-2 text-gray-500"><DynamicIcon name={asset.icon} className="w-4 h-4" /></span>
                          {asset.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryLabels[asset.type] || asset.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${asset.is_maintenance ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {asset.is_maintenance ? 'In Wartung' : 'Verfügbar'}
                          </span>
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
             <div className="overflow-x-auto">
               {bookings.length === 0 ? (
                 <p className="text-gray-500 text-center py-8">Keine Buchungen vorhanden.</p>
               ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel / Nutzer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeitraum</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {assets.find(a => a.id === b.assetId)?.name || b.assetId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="font-bold text-indigo-700">{b.title}</div>
                          {b.userName} <span className="text-xs text-gray-400">({b.userEmail})</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {new Date(b.startTime).toLocaleDateString()} <br />
                           {new Date(b.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(b.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => deleteBooking(b.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Löschen"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               )}
             </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Konfiguration</h3>
              <form onSubmit={saveSettings} className="space-y-8">
                
                {/* General */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-4">Allgemein</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">System Name (Header Text)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Settings className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md border p-2"
                        value={config.headerText}
                        onChange={e => setConfig({ ...config, headerText: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Placeholders */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-4">Buchungsformular: Platzhalter</h4>
                  <p className="text-sm text-gray-500 mb-4">Definieren Sie, was als Platzhalter in den Eingabefeldern der Buchungsmaske angezeigt werden soll.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Platzhalter für "Titel / Grund"</label>
                      <input
                        type="text"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                        value={config.placeholderTitle || ''}
                        placeholder="z.B. Team Meeting, Kundenbesuch"
                        onChange={e => setConfig({ ...config, placeholderTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Platzhalter für "Name"</label>
                      <input
                        type="text"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                        value={config.placeholderName || ''}
                        placeholder="z.B. Max Mustermann"
                        onChange={e => setConfig({ ...config, placeholderName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Platzhalter für "E-Mail"</label>
                      <input
                        type="text"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                        value={config.placeholderEmail || ''}
                        placeholder="z.B. max@firma.de"
                        onChange={e => setConfig({ ...config, placeholderEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Category Icons */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-4">Kategorie Icons</h4>
                  <p className="text-sm text-gray-500 mb-4">Wählen Sie Standard-Icons für die verschiedenen Ressourcentypen, die auf der Startseite angezeigt werden.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(categoryLabels).map(([type, label]) => (
                      <div key={type}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <select
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                          value={config.categoryIcons?.[type] || ''}
                          onChange={(e) => handleCategoryIconChange(type, e.target.value)}
                        >
                          <option value="">Standard</option>
                          {Object.keys(ICON_MAP).map(iconName => (
                            <option key={iconName} value={iconName}>{iconName}</option>
                          ))}
                        </select>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          Vorschau: <span className="ml-2 bg-white p-1 rounded border"><DynamicIcon name={config.categoryIcons?.[type]} className="w-4 h-4 text-gray-700" /></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                   <button
                    type="submit"
                    disabled={savingConfig}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      savingConfig ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                   >
                     <Save className="w-4 h-4 mr-2" />
                     {savingConfig ? 'Speichere...' : 'Speichern'}
                   </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Asset Modal */}
      {isAssetModalOpen && (
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
                    onChange={e => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Typ</label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={editingAsset.type || 'Room'}
                    onChange={e => setEditingAsset({ ...editingAsset, type: e.target.value })}
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
                    onChange={e => setEditingAsset({ ...editingAsset, description: e.target.value })}
                  />
                </div>
                
                {/* Color & Maintenance */}
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farbe 
                        <button type="button" onClick={() => setEditingAsset({...editingAsset, color: getRandomColor()})} className="ml-2 text-xs text-indigo-600 hover:underline"><RefreshCw className="inline w-3 h-3"/> Zufall</button>
                      </label>
                      <input
                        type="color"
                        className="block w-full h-10 p-0 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={editingAsset.color || '#3b82f6'}
                        onChange={e => setEditingAsset({ ...editingAsset, color: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center h-10 pb-3">
                      <input
                        id="maintenance_toggle"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={editingAsset.is_maintenance || false}
                        onChange={e => setEditingAsset({ ...editingAsset, is_maintenance: e.target.checked })}
                      />
                      <label htmlFor="maintenance_toggle" className="ml-2 block text-sm text-gray-900">
                        In Wartung?
                      </label>
                    </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                     {Object.keys(ICON_MAP).map(iconName => (
                       <button
                        key={iconName}
                        type="button"
                        onClick={() => setEditingAsset({...editingAsset, icon: iconName})}
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
      )}
    </div>
  );
};