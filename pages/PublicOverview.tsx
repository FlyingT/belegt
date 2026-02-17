import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Coffee, Layout, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import { Asset, Booking } from '../types';

export default function PublicOverview() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assetsData, bookingsData] = await Promise.all([
                    api.api.getAssets(),
                    api.api.getBookings()
                ]);
                setAssets(assetsData);
                setBookings(bookingsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        const intervalId = setInterval(() => {
            setSecondsUntilRefresh(prev => {
                if (prev <= 1) {
                    fetchData();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfToday.getDate() + 1);

    const todayBookings = bookings
        .filter((b: Booking) => {
            const d = new Date(b.startTime);
            return d >= startOfToday && d < startOfTomorrow;
        })
        .sort((a: Booking, b: Booking) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const upcomingBookings = bookings
        .filter((b: Booking) => new Date(b.startTime) >= startOfTomorrow)
        .sort((a: Booking, b: Booking) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const pastBookings = bookings
        .filter((b: Booking) => new Date(b.endTime) < startOfToday)
        .sort((a: Booking, b: Booking) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <Layout className="w-8 h-8 text-indigo-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buchungsübersicht</h1>
                    </div>
                    <Link
                        to="/"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zur Buchung
                    </Link>
                </div>

                <div className="space-y-12">
                    {/* Tagesübersicht */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-indigo-500" /> Tagesübersicht (Heute)
                        </h2>
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ressource</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Titel / Nutzer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catering</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zeitraum</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {todayBookings.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Keine Buchungen für heute.</td></tr>
                                    ) : (
                                        todayBookings.map((b: Booking) => (
                                            <tr key={b.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {assets.find((a: Asset) => a.id === b.assetId)?.name || 'Gelöschte Ressource'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                    <div className="font-bold">{b.title}</div>
                                                    <div className="text-gray-500 dark:text-gray-400">{b.userName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {b.catering && Object.entries(b.catering).length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(b.catering).filter(([_, qty]) => (qty as number) > 0).map(([item, qty]: [string, unknown]) => (
                                                                <span key={item} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50">
                                                                    {item}: {qty as number}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {b.costCenter && (
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50">
                                                                KSt: {b.costCenter}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                    {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Anstehend */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Anstehend (ab Morgen)
                        </h2>
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Datum</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ressource</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Titel / Nutzer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catering</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zeit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {upcomingBookings.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Keine anstehenden Buchungen.</td></tr>
                                    ) : (
                                        upcomingBookings.map((b: Booking) => (
                                            <tr key={b.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(b.startTime).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{assets.find(a => a.id === b.assetId)?.name || 'Gelöschte Ressource'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                                                    <div className="text-indigo-700 dark:text-indigo-400">{b.title}</div>
                                                    {b.userName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {b.catering && Object.entries(b.catering).length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(b.catering).filter(([_, qty]) => (qty as number) > 0).map(([item, qty]) => (
                                                                <span key={item} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50">
                                                                    {item}: {qty as number}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {b.costCenter && (
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50">
                                                                KSt: {b.costCenter}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Vergangen */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center opacity-60">
                            <Clock className="w-5 h-5 mr-2" /> Vergangen
                        </h2>
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 opacity-60 transition-opacity hover:opacity-100">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Datum</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ressource</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Titel / Nutzer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catering</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zeit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {pastBookings.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Keine vergangenen Buchungen.</td></tr>
                                    ) : (
                                        pastBookings.map((b: Booking) => (
                                            <tr key={b.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(b.startTime).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{assets.find(a => a.id === b.assetId)?.name || 'Gelöschte Ressource'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                    <div>{b.title}</div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{b.userName}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {b.catering && Object.entries(b.catering).length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(b.catering).filter(([_, qty]) => (qty as number) > 0).map(([item, qty]: [string, unknown]) => (
                                                                <span key={item} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                                                    {item}: {qty as number}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {b.costCenter && (
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                                                KSt: {b.costCenter}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* Auto-Refresh Countdown Footer */}
            <div className="fixed bottom-0 left-0 right-0 py-2 text-center text-xs text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 pointer-events-none">
                Info Ansicht • Aktualisierung in {secondsUntilRefresh}s
            </div>
        </div>
    );
}
