import React from 'react';
import { 
  BarChart, CreditCardAlt, LoaderLinesAlt, Save, Envelope, Send, 
  CheckCircle, Lock, Check, SearchAlt, Rocket, Star, Like, 
  ArrowLeft, InfoCircle, Calendar, Clock, Rupee, Search, BookOpen, 
  FingerTouch, X, Play, CheckSquare, CalendarEvent, Link, 
  Note, ShieldQuarter, AlertCircle, LockOpenAlt, UserPlus, Walking, 
  DoorOpen, Camera, Trash, ArrowRight, MapIcon, Target, 
  TrendingUp, Location, Grid, Hourglass, PlayCircle, Block
} from '@boxicons/react';

const iconMap: Record<string, React.ElementType> = {
  'bx-bar-chart-alt-2': BarChart,
  'bx-credit-card-alt': CreditCardAlt,
  'bx-loader-alt': LoaderLinesAlt,
  'bx-save': Save,
  'bx-envelope': Envelope,
  'bx-send': Send,
  'bx-check-circle': CheckCircle,
  'bx-lock-alt': Lock,
  'bx-check': Check,
  'bx-search-alt': SearchAlt,
  'bx-rocket': Rocket,
  'bx-star': Star,
  'bx-like': Like,
  'bx-arrow-back': ArrowLeft,
  'bx-info-circle': InfoCircle,
  'bx-calendar': Calendar,
  'bx-time': Clock,
  'bx-rupee': Rupee,
  'bx-search': Search,
  'bx-book-open': BookOpen,
  'bx-finger-touch': FingerTouch,
  'bx-x': X,
  'bx-play': Play,
  'bx-check-square': CheckSquare,
  'bx-calendar-event': CalendarEvent,
  'bx-link-external': Link,
  'bx-note': Note,
  'bx-shield-quarter': ShieldQuarter,
  'bx-error-circle': AlertCircle,
  'bx-lock-open-alt': LockOpenAlt,
  'bx-user-plus': UserPlus,
  'bx-walk': Walking,
  'bx-book-reader': BookOpen,
  'bx-log-in': DoorOpen,
  'bx-camera': Camera,
  'bx-trash': Trash,
  'bx-right-arrow-alt': ArrowRight,
  'bx-map': MapIcon,
  'bx-target-lock': Target,
  'bx-trending-up': TrendingUp,
  'bx-current-location': Location,
  'bx-grid-alt': Grid,
  'bx-hourglass': Hourglass,
  'bx-play-circle': PlayCircle,
  'bx-block': Block,
};

export function BoxIcon({ className, ...props }: { className?: string } & React.HTMLAttributes<HTMLElement>) {
  if (!className) return <i className={className} {...props} />;
  
  // Extract the bx-* class to identify the icon
  const classes = className.split(' ').map(c => c.trim()).filter(Boolean);
  const iconName = classes.find(c => c.startsWith('bx-'));
  
  // Remove 'bx' and 'bx-*' from the className to pass to the SVG
  const remainingClasses = classes.filter(c => c !== 'bx' && !c.startsWith('bx-')).join(' ');
  
  if (!iconName || !iconMap[iconName]) {
    // Fallback if icon is missing or not mapped
    return <i className={className} {...props} />;
  }
  
  const IconComponent = iconMap[iconName];
  return <IconComponent className={remainingClasses || undefined} {...props} />;
}
