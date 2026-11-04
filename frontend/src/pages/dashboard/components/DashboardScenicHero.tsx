import React from 'react';
import { Link } from 'react-router-dom';
import { Button, type ButtonVariant } from '../../../components/ui';
import { PlusIcon, TrendingUpIcon, AwardIcon } from '../../../components/common/Icons';

export interface DashboardHeroTickerItem {
  dotColor: string;
  label: string;
  value: React.ReactNode;
}

export interface DashboardHeroAction {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

export interface DashboardScenicHeroProps {
  totalRevenue?: string;
  dealsWon?: number;
  winRate?: string;
  badge?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  actions?: DashboardHeroAction[];
  tickerItems?: DashboardHeroTickerItem[];
}

export const DashboardScenicHero: React.FC<DashboardScenicHeroProps> = ({
  totalRevenue = '$0',
  dealsWon = 0,
  winRate = '0%',
  badge = 'Enterprise Intelligence Hub',
  title = 'Deliver Impact.',
  highlight = 'Close Deals Faster.',
  subtitle = 'Real-time CRM execution across your pipelines. Track revenue momentum, convert high-value leads, and align your teams with automated intelligence.',
  actions,
  tickerItems,
}) => {
  const defaultActions: DashboardHeroAction[] = [
    {
      label: 'Create Deal',
      to: '/deals/create',
      variant: 'secondary',
      icon: <PlusIcon size={15} />,
    },
    {
      label: 'Capture Lead',
      to: '/leads/create',
      variant: 'outline',
      icon: <PlusIcon size={15} />,
    },
    {
      label: 'Revenue Forecast',
      to: '/dashboard/revenue',
      variant: 'accent',
      icon: <TrendingUpIcon size={15} />,
    },
  ];

  const resolvedActions = actions && actions.length > 0 ? actions : defaultActions;

  const defaultTickerItems: DashboardHeroTickerItem[] = [
    {
      dotColor: '#10b981',
      label: 'Revenue Won:',
      value: totalRevenue,
    },
    {
      dotColor: '#7c3aed',
      label: 'Deals Closed:',
      value: `${dealsWon} Deals`,
    },
    {
      dotColor: '#059669',
      label: 'Win Rate:',
      value: winRate,
    },
  ];

  const resolvedTickerItems = tickerItems && tickerItems.length > 0 ? tickerItems : defaultTickerItems;

  return (
    <section className="crm-hero-banner" aria-label="Executive Dashboard Overview Showcase">
      <div className="crm-hero-content">
        <div className="crm-hero-badge">
          <span style={{ fontSize: '13px' }}>✨</span>
          <span>{badge}</span>
        </div>

        <h1 className="crm-hero-title">
          {title}{' '}
          <span
            className="crm-hero-highlight"
            style={{
              color: '#000000',
              WebkitTextFillColor: '#000000',
              background: 'none',
            }}
          >
            {highlight}
          </span>
        </h1>

        <p className="crm-hero-subtitle">
          {subtitle}
        </p>

        <div className="crm-hero-actions">
          {resolvedActions.map((act, idx) =>
            act.to ? (
              <Link key={idx} to={act.to}>
                <Button variant={act.variant || 'outline'} pill icon={act.icon}>
                  {act.label}
                </Button>
              </Link>
            ) : (
              <Button
                key={idx}
                type="button"
                onClick={act.onClick}
                variant={act.variant || 'outline'}
                pill
                icon={act.icon}
              >
                {act.label}
              </Button>
            ),
          )}
        </div>

        {/* Mini quick-metrics pills below hero */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {resolvedTickerItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8rem',
                color: '#000000',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: item.dotColor,
                }}
              />
              <span>{item.label}</span>
              <strong style={{ color: '#000000', fontWeight: 800 }}>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Scenic Illustration (Inspired by Reference Image's Arched Architecture & Bicycle) */}
      <div className="crm-hero-visual" aria-hidden="true">
        <div className="crm-scenic-arch">
          <div className="crm-arch-lamp">
            <AwardIcon size={16} />
          </div>

          <div className="crm-arch-door">
            <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v7M12 14v7M16 14v7" />
            </svg>
          </div>

          <div className="crm-arch-bike-wrap">
            <div className="crm-arch-plant" title="Growth" />
            <div style={{ fontSize: '24px' }}>🚲</div>
            <div className="crm-arch-plant" title="Nurture" />
          </div>
        </div>
      </div>
    </section>
  );
};
