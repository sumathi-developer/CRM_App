import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui';
import { PlusIcon, TrendingUpIcon, AwardIcon } from '../../../components/common/Icons';

interface DashboardScenicHeroProps {
  totalRevenue?: string;
  dealsWon?: number;
  winRate?: string;
}

export const DashboardScenicHero: React.FC<DashboardScenicHeroProps> = ({
  totalRevenue = '$0',
  dealsWon = 0,
  winRate = '0%',
}) => {
  return (
    <section className="crm-hero-banner" aria-label="Executive Dashboard Overview Showcase">
      <div className="crm-hero-content">
        <div className="crm-hero-badge">
          <span style={{ fontSize: '13px' }}>✨</span>
          <span>Enterprise Intelligence Hub</span>
        </div>

        <h1 className="crm-hero-title">
          Deliver Impact. <span>Close Deals Faster.</span>
        </h1>

        <p className="crm-hero-subtitle">
          Real-time CRM execution across your pipelines. Track revenue momentum, convert high-value leads,
          and align your teams with automated intelligence.
        </p>

        <div className="crm-hero-actions">
          <Link to="/deals/create">
            <Button variant="secondary" pill icon={<PlusIcon size={15} />}>
              Create Deal
            </Button>
          </Link>

          <Link to="/leads/create">
            <Button variant="outline" pill icon={<PlusIcon size={15} />}>
              Capture Lead
            </Button>
          </Link>

          <Link to="/dashboard/revenue">
            <Button variant="accent" pill icon={<TrendingUpIcon size={15} />}>
              Revenue Forecast
            </Button>
          </Link>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span>Revenue Won:</span>
            <strong style={{ color: '#062E03', fontWeight: 800 }}>{totalRevenue}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
            <span>Deals Closed:</span>
            <strong style={{ color: '#062E03', fontWeight: 800 }}>{dealsWon} Deals</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            <span>Win Rate:</span>
            <strong style={{ color: '#062E03', fontWeight: 800 }}>{winRate}</strong>
          </div>
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

