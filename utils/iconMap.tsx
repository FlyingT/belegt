import React from 'react';
import { 
  Monitor, Truck, Box, Wrench, Home, Users, Briefcase, Zap, 
  Coffee, Laptop, Printer, Car, Bike, Anchor, Star, Heart, 
  Circle, Square, Triangle, Layout, Smartphone, Camera, Mic,
  Speaker, Wifi, Key, Layers, Archive, PenTool, Flag,
  Projector, Cable, Usb
} from 'lucide-react';

// Map of available icons for the user to choose from
export const ICON_MAP: Record<string, React.FC<any>> = {
  'Monitor': Monitor,
  'Truck': Truck,
  'Box': Box,
  'Wrench': Wrench,
  'Home': Home,
  'Users': Users,
  'Briefcase': Briefcase,
  'Zap': Zap,
  'Coffee': Coffee,
  'Laptop': Laptop,
  'Printer': Printer,
  'Car': Car,
  'Bike': Bike,
  'Anchor': Anchor,
  'Star': Star,
  'Heart': Heart,
  'Layout': Layout,
  'Smartphone': Smartphone,
  'Camera': Camera,
  'Mic': Mic,
  'Speaker': Speaker,
  'Wifi': Wifi,
  'Key': Key,
  'Layers': Layers,
  'Archive': Archive,
  'PenTool': PenTool,
  'Flag': Flag,
  'Projector': Projector,
  'Cable': Cable,
  'Usb': Usb
};

// Helper to render icon by name with fallback
export const DynamicIcon = ({ name, className }: { name?: string, className?: string }) => {
  const IconComponent = name && ICON_MAP[name] ? ICON_MAP[name] : Box;
  return <IconComponent className={className} />;
};