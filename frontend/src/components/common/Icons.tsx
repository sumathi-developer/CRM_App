import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

export const MailIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m15 18-.722-3.25" />
    <path d="M2 2l20 20" />
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

export const RefreshCwIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

export const KeyRoundIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
    <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
  </svg>
);

export const BuildingIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const MonitorIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

export const SmartphoneIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

export const TabletIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="20" x="3" y="2" rx="2" ry="2" />
    <line x1="12" x2="12.01" y1="18" y2="18" />
  </svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const XIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const UserPlusIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" x2="16.65" y1="21" y2="16.65" />
  </svg>
);

export const EditIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);


export const GlobeIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" x2="22" y1="12" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const PaletteIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

export const SlidersIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" x2="4" y1="21" y2="14" />
    <line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" />
    <line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" />
    <line x1="20" x2="20" y1="12" y2="3" />
    <line x1="1" x2="7" y1="14" y2="14" />
    <line x1="9" x2="15" y1="8" y2="8" />
    <line x1="17" x2="23" y1="16" y2="16" />
  </svg>
);

export const FilterIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" x2="21" y1="14" y2="3" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

export const ActivityIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export const SendIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="22" x2="11" y1="2" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const AwardIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export const DollarSignIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const MoreVerticalIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export const CrownIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

export const UserMinusIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </svg>
);

export const TagIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

export const BarChart2Icon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" x2="18" y1="20" y2="10" />
    <line x1="12" x2="12" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="14" />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export const HelpCircleIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const LifeBuoyIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const ZapIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const FileTextIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const DealsIcon: React.FC<IconProps> = ({ size = 18, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="48 6.5 248 248"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M 158.778 20.342 C 152.012 23.194, 147.661 26.715, 142.646 33.396 C 129.510 50.896, 136.507 77.341, 156.893 87.244 C 162.841 90.134, 164.397 90.453, 172.500 90.443 C 180.249 90.434, 182.282 90.053, 187.124 87.703 C 195.512 83.633, 201.424 77.916, 205.213 70.213 C 208.230 64.078, 208.500 62.750, 208.500 54.015 C 208.500 45.443, 208.203 43.906, 205.500 38.501 C 201.742 30.985, 195.133 24.426, 188 21.134 C 179.826 17.361, 166.697 17.005, 158.778 20.342 M 165.500 24.877 C 152.357 28.359, 142.872 40.215, 142.672 53.411 C 142.484 65.819, 148.283 75.487, 159.179 80.932 C 164.338 83.510, 166.478 84, 172.572 84 C 178.807 84, 180.710 83.542, 186.132 80.735 C 204.639 71.154, 208.120 46.740, 192.996 32.593 C 190.362 30.129, 186.473 27.387, 184.353 26.499 C 179.836 24.607, 169.785 23.742, 165.500 24.877 M 175.278 50.187 L 167.057 58.428 164.127 55.622 C 160.928 52.556, 157.731 52.444, 157.166 55.376 C 156.747 57.554, 164.573 66, 167.010 66 C 167.887 66, 172.988 61.644, 178.348 56.319 C 185.359 49.353, 188.009 46.058, 187.796 44.569 C 187.168 40.180, 183.716 41.730, 175.278 50.187 M 101.020 82.284 C 99.656 82.974, 95.823 87.130, 92.502 91.520 C 80.944 106.795, 59.320 136.515, 58.103 138.799 C 55.839 143.046, 58.236 146.838, 68.027 154.495 C 78.717 162.855, 80.830 163.730, 85.142 161.579 C 88.975 159.667, 88.524 159.667, 90.429 161.571 C 91.505 162.648, 92 165.018, 92 169.101 C 92 174.532, 91.650 175.502, 88.037 180.072 C 85.858 182.829, 83.783 186.641, 83.426 188.543 C 81.486 198.884, 89.002 208, 99.468 208 C 102.463 208, 103.001 208.342, 103.004 210.250 C 103.009 213.538, 106.499 218.724, 110.241 221.005 C 112.347 222.290, 115.276 222.994, 118.523 222.996 C 123.278 223, 123.650 223.195, 125.519 226.664 C 128.316 231.858, 132.312 233.992, 139.250 233.996 C 142.412 233.998, 145 234.434, 145 234.965 C 145 235.496, 146.391 237.515, 148.091 239.451 C 153.697 245.836, 162.468 246.259, 168.302 240.426 C 170.627 238.100, 171.049 238.021, 175.178 239.125 C 184.212 241.541, 191.917 237.187, 194.125 228.416 C 194.972 225.056, 195.711 224, 197.218 224 C 203.267 224, 210 217.290, 210 211.262 C 210 208.566, 210.450 208.134, 214.414 207.024 C 221.024 205.173, 226 198.996, 226 192.642 C 226 190.862, 226.865 190.183, 230.309 189.262 C 237.184 187.424, 242 181.575, 242 175.064 C 242 172.451, 242.345 172.212, 247.013 171.593 C 249.925 171.206, 253.616 171.404, 255.819 172.064 C 259.378 173.130, 260.350 172.876, 271.556 167.945 C 278.125 165.055, 284.247 162.052, 285.160 161.272 C 288.033 158.816, 288.150 155.435, 285.591 148.794 C 276.736 125.804, 259.855 85.497, 258.417 83.908 C 255.649 80.849, 250.869 81.601, 238.737 87.004 C 227.090 92.191, 224 94.606, 224 98.522 C 224 100.257, 222.899 101.354, 219.519 102.991 L 215.037 105.160 195.043 102.080 C 184.046 100.386, 172.995 99, 170.484 99 C 165.713 99, 159.546 101.563, 154.826 105.508 C 152.519 107.437, 150.866 107.767, 142.763 107.918 C 131.068 108.136, 128 107.136, 128 103.107 C 128 101.488, 127.728 99.454, 127.395 98.586 C 126.596 96.506, 110.068 83.356, 106.588 82.033 C 103.338 80.798, 104.018 80.767, 101.020 82.284 M 94.935 99.191 C 90.361 105.411, 81.529 117.356, 75.309 125.735 C 69.089 134.114, 64 141.418, 64 141.967 C 64 143.150, 80.050 155.989, 81.500 155.966 C 82.975 155.944, 121.879 102.828, 121.342 101.571 C 120.787 100.275, 106.858 89.266, 104.749 88.457 C 103.698 88.054, 100.775 91.251, 94.935 99.191 M 249 89.478 C 247.625 90.266, 243.012 92.332, 238.750 94.068 C 233.525 96.196, 231 97.758, 230.999 98.862 C 230.997 101.890, 257.431 166, 258.681 166 C 259.360 166, 264.688 163.897, 270.522 161.328 C 280.113 157.103, 281.076 156.441, 280.569 154.420 C 278.973 148.060, 253.993 88.468, 252.842 88.272 C 252.104 88.147, 250.375 88.689, 249 89.478 M 165.091 106.558 C 163.216 107.371, 157.254 112.388, 151.841 117.706 C 140.275 129.069, 139.647 130.936, 146.508 133.556 C 152.356 135.789, 159.997 135.049, 166.829 131.586 C 172.589 128.668, 179.870 128.162, 184.129 130.384 C 185.575 131.139, 195.015 138.405, 205.106 146.531 C 226.363 163.648, 227.980 164.724, 233.724 165.586 C 239.292 166.421, 248.997 165.209, 249.009 163.678 C 249.016 162.682, 227.237 108.112, 226.460 107.180 C 226.314 107.004, 224.368 107.792, 222.137 108.930 C 216.873 111.615, 215.125 111.562, 191.500 108 C 168.670 104.557, 169.585 104.607, 165.091 106.558 M 107.876 132.280 L 92.252 153.500 94.601 156.028 C 95.893 157.419, 97.465 160.034, 98.094 161.840 C 98.955 164.309, 99.643 164.950, 100.869 164.427 C 107.635 161.539, 110.243 161.044, 114.113 161.914 C 120.484 163.346, 126 169.626, 126 175.450 C 126 177.623, 126.449 178, 129.032 178 C 136.292 178, 143.491 183.963, 144.599 190.896 C 145.140 194.274, 145.602 194.746, 149.349 195.750 C 154.370 197.095, 158.976 201.643, 159.900 206.169 C 160.510 209.158, 160.998 209.556, 164.660 210.050 C 169.984 210.768, 173.314 213.034, 175.351 217.326 C 177.221 221.267, 177.460 225.659, 176.013 229.465 C 175.147 231.744, 175.329 232.175, 177.513 233.005 C 184.672 235.727, 191.259 225.876, 186.032 220.265 C 184.950 219.103, 179.550 214.676, 174.032 210.426 C 166.601 204.703, 164 202.119, 164 200.457 C 164 197.999, 166.597 196.450, 168.377 197.847 C 188.133 213.359, 193.473 217, 196.468 217 C 201.369 217, 204.767 212.147, 203.042 207.610 C 202.521 206.239, 196.603 201.297, 189.028 195.906 C 178.730 188.576, 175.979 186.137, 176.208 184.537 C 176.806 180.360, 180.432 181.763, 194.069 191.447 C 207.681 201.115, 210.658 202.324, 215.055 199.970 C 217.795 198.504, 220.236 193.336, 219.433 190.700 C 218.386 187.259, 216.409 185.438, 202.250 174.861 C 194.963 169.417, 189 164.352, 189 163.604 C 189 162.857, 189.646 161.709, 190.436 161.053 C 192.344 159.470, 193.151 159.939, 210.232 172.567 C 221.128 180.622, 225.063 183, 227.498 183 C 231.532 183, 235 179.447, 235 175.313 C 235 172.488, 234.677 172.205, 230.750 171.584 C 225.344 170.730, 222.256 168.662, 201.500 152.004 C 192.150 144.500, 183.263 137.553, 181.752 136.566 C 178.498 134.442, 175.839 134.779, 167.500 138.369 C 153.134 144.555, 135 139.724, 135 129.712 C 135 126.040, 137.066 122.833, 142.972 117.337 L 146.500 114.054 138 113.992 C 132.570 113.952, 128.597 113.413, 127 112.500 C 125.625 111.714, 124.275 111.068, 124 111.065 C 123.725 111.062, 116.469 120.609, 107.876 132.280 M 105.794 169.056 C 104.855 169.603, 100.918 174.146, 97.044 179.152 C 91.449 186.382, 90 188.961, 90 191.692 C 90 196.217, 91.392 198.634, 95.103 200.553 C 100.117 203.146, 103.350 201.703, 109.410 194.165 C 121.117 179.603, 122.268 176.114, 117.077 170.923 C 114.005 167.851, 109.219 167.059, 105.794 169.056 M 126.362 184.968 C 124.284 185.828, 112.507 200.175, 110.082 204.799 C 108.202 208.386, 110.381 213.737, 114.527 215.714 C 119.630 218.147, 122.716 216.284, 130.936 205.806 C 136.486 198.732, 138 196.085, 138 193.457 C 138 187.445, 131.621 182.792, 126.362 184.968 M 139.872 205.750 C 134.652 211.290, 130 218.134, 130 220.274 C 130 222.920, 135.388 228.003, 138.173 227.985 C 141.506 227.963, 142.330 227.247, 148.479 219.028 C 154.605 210.840, 155.183 208.092, 151.545 204.455 C 147.900 200.809, 144.135 201.227, 139.872 205.750 M 156.452 219.750 C 149.556 227.253, 148.813 232.654, 154.159 236.399 C 159.370 240.049, 164.804 237.167, 168.980 228.540 C 170.663 225.064, 170.851 223.739, 169.986 221.463 C 167.488 214.893, 161.600 214.148, 156.452 219.750"
    />
  </svg>
);

export const HandshakeDealIcon = DealsIcon;

