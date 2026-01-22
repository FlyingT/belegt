import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Asset } from '../types';
import { api } from '../services/api';
import { Monitor, Wrench, Truck, Box, ShieldAlert, Layers } from 'lucide-react';

const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'room': return <Monitor className="w-6 h-6" />;
    case 'vehicle': return <Truck className="w-6 h-6" />;
    case 'equipment': return <Box className="w-6 h-6" />;
    default: return <Wrench className="w-6 h-6" />;
  }
};

const getCategoryName = (type: string) => {
  switch (type) {
    case 'Room': return 'Räume';
    case 'Vehicle': return 'Fahrzeuge';
    case 'Equipment': return 'Ausrüstung';
    default: return 'Sonstiges';
  }
};

export const Dashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAssets().then(data => {
      setAssets(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Lade Ressourcen...</div>;
  }

  // Group assets by type
  const groupedAssets = assets.reduce((acc, asset) => {
    const type = asset.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  // Define sort order for categories
  const sortOrder = ['Room', 'Vehicle', 'Equipment', 'Other'];
  const sortedCategories = Object.keys(groupedAssets).sort((a, b) => {
    const indexA = sortOrder.indexOf(a);
    const indexB = sortOrder.indexOf(b);
    // If not found in sortOrder, put at the end
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Verfügbare Ressourcen</h1>
        <p className="mt-2 text-gray-600">Wählen Sie eine Ressource aus, um eine Buchung vorzunehmen oder den Status zu prüfen.</p>
      </div>

      <div className="space-y-12">
        {sortedCategories.map((category) => (
          <div key={category}>
            <div className="flex items-center mb-6 border-b border-gray-200 pb-2">
              <span className="bg-indigo-100 text-indigo-800 p-2 rounded-lg mr-3">
                {getIcon(category)}
              </span>
              <h2 className="text-2xl font-semibold text-gray-800">
                {getCategoryName(category)}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedAssets[category].map((asset) => (
                <div 
                  key={asset.id} 
                  className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 transition-transform hover:scale-[1.02] ${asset.is_maintenance ? 'border-gray-400 opacity-75' : ''}`}
                  style={{ borderLeftColor: asset.is_maintenance ? undefined : asset.color }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div 
                        className={`p-2 rounded-lg text-white`}
                        style={{ backgroundColor: asset.is_maintenance ? '#9ca3af' : asset.color }}
                      >
                        {getIcon(asset.type)}
                      </div>
                      {asset.is_maintenance && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          In Wartung
                        </span>
                      )}
                    </div>
                    
                    <h3 className="mt-4 text-lg font-medium text-gray-900">{asset.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{asset.description}</p>
                    
                    <div className="mt-6 flex gap-3">
                      {asset.is_maintenance ? (
                        <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed">
                          Nicht buchbar
                        </button>
                      ) : (
                        <Link 
                          to={`/book/${asset.id}`}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                          Buchen
                        </Link>
                      )}
                      
                      <Link 
                        to={`/kiosk/${asset.id}`}
                        className="flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        title="Kiosk Modus öffnen"
                      >
                        <Monitor className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {assets.length === 0 && (
         <div className="text-center py-12 bg-white rounded-lg shadow">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Keine Ressourcen gefunden</h3>
            <p className="text-gray-500">Es wurden noch keine Ressourcen angelegt.</p>
         </div>
      )}
    </div>
  );
};