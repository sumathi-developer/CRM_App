import React from 'react';

export {
  SlidersIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  XIcon,
  FilterIcon,
  CalendarIcon,
  BuildingIcon,
  UserIcon,
  LockIcon,
  ShieldIcon,
  DollarSignIcon,
  ActivityIcon,
  ClockIcon,
} from '../../components/common/Icons';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

export const CopyIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

export const LayersIcon: React.FC<IconProps> = ({ size = 18, strokeWidth = 2, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
