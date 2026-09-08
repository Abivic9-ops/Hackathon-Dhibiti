import {
  Banknote,
  BellRing,
  Bitcoin,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  CircleHelp,
  Contact,
  CreditCard,
  Fingerprint,
  Flag,
  Gift,
  Globe,
  GraduationCap,
  Handshake,
  House,
  IdCard,
  Landmark,
  Link2,
  type LucideIcon,
  MessageSquareText,
  PhoneCall,
  PiggyBank,
  QrCode,
  Radar,
  RefreshCcwDot,
  Repeat2,
  Scale,
  Search,
  ShieldCheck,
  Siren,
  Smartphone,
  Store,
  Truck,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react-native';

import type {
  ActionKind,
  CheckType,
  IdentifierType,
  LessonCategory,
  QrContentType,
  ScamCategory,
} from '@/lib/types';

export const CHECK_TYPE_ICON: Record<CheckType, LucideIcon> = {
  sms: MessageSquareText,
  call: PhoneCall,
  qr: QrCode,
  number: Search,
  link: Link2,
};

export const CHECK_TYPE_LABEL: Record<CheckType, string> = {
  sms: 'Message',
  call: 'Call',
  qr: 'QR code',
  number: 'Number lookup',
  link: 'Link',
};

export const IDENTIFIER_ICON: Record<IdentifierType, LucideIcon> = {
  phone: Smartphone,
  paybill: Banknote,
  till: Store,
  url: Globe,
  account: Landmark,
  crypto: Bitcoin,
};

export const IDENTIFIER_LABEL: Record<IdentifierType, string> = {
  phone: 'Phone number',
  paybill: 'Paybill',
  till: 'Till number',
  url: 'Link',
  account: 'Bank account',
  crypto: 'Crypto address',
};

export const SCAM_CATEGORY_ICON: Record<ScamCategory, LucideIcon> = {
  'mpesa-reversal': Repeat2,
  'fake-safaricom-agent': Smartphone,
  'fake-bank-rep': Landmark,
  'police-impersonation': Siren,
  'family-emergency': Users,
  'fake-job-loan': Briefcase,
  'prize-lottery': Gift,
  'sim-swap': RefreshCcwDot,
  'fake-delivery': Truck,
  'qr-merchant-phishing': QrCode,
  'crypto-investment': Bitcoin,
  none: ShieldCheck,
};

export const LESSON_CATEGORY_ICON: Record<LessonCategory, LucideIcon> = {
  'scam-patterns': Fingerprint,
  'mobile-money': Wallet,
  'banks-merchants': Building2,
  'rights-recourse': Scale,
};

export const LESSON_CATEGORY_LABEL: Record<LessonCategory, string> = {
  'scam-patterns': 'Scam patterns',
  'mobile-money': 'Mobile money basics',
  'banks-merchants': 'Banks & merchants',
  'rights-recourse': 'Rights & recourse',
};

export const QR_CONTENT_ICON: Record<QrContentType, LucideIcon> = {
  url: Globe,
  'mobile-money': Banknote,
  phone: Smartphone,
  crypto: Bitcoin,
  wifi: Wifi,
  vcard: Contact,
  text: MessageSquareText,
};

export const ACTION_ICON: Record<ActionKind, LucideIcon> = {
  'call-verified': Landmark,
  'call-contact': PhoneCall,
  'safe-pay': CreditCard,
  lookup: Search,
  report: Flag,
  lesson: GraduationCap,
  browser: Globe,
  family: Users,
  dismiss: ShieldCheck,
  quarantine: BellRing,
};

export {
  BookOpen,
  Camera,
  CircleHelp,
  Fingerprint,
  Handshake,
  House,
  IdCard,
  PiggyBank,
  QrCode,
  Radar,
  ShieldCheck,
  Wallet,
};
