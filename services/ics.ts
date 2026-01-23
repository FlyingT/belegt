import { Booking, Asset } from '../types';

export const generateICS = (booking: Booking, assetName: string): string => {
  const formatDate = (dateStr: string) => {
    // Format: YYYYMMDDTHHmmSSZ
    const d = new Date(dateStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatDate(booking.startTime);
  const end = formatDate(booking.endTime);
  const now = formatDate(new Date().toISOString());

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Belegt?//DE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTAMP:${now}`,
    `UID:${booking.id}@belegt.local`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${booking.title} (${assetName})`,
    `DESCRIPTION:Gebucht von ${booking.userName}`,
    `LOCATION:${assetName}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return icsLines.join('\r\n');
};

export const downloadICS = (booking: Booking, assetName: string) => {
  const icsContent = generateICS(booking, assetName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `booking_${booking.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};