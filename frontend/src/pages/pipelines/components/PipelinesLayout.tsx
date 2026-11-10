import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../../../components/common/Navbar';
import { ErrorMessage } from '../../../components/auth/ErrorMessage';
import { SuccessMessage } from '../../../components/auth/SuccessMessage';
import {
  TrendingUpIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  CheckIcon,
} from '../../../components/common/Icons';
import { Badge } from '../../lead-generation/components/Cards';
import type { Pipeline } from '../../../types/pipeline.types';

interface PipelineNavLink {
  to: string;
  label: string;
  end?: boolean;
  isActive?: (pathname: string) => boolean;
}

interface PipelineNavGroup {
  id: string;
  label: string;
  links: PipelineNavLink[];
}

const getPipelinesNavGroups = (activePipeline?: Pipeline | null): PipelineNavGroup[] => {
  const pId = activePipeline?.id;
  return [
    {
      id: 'views',
      label: 'Pipeline Views',
      links: [
        {
          to: pId ? `/pipelines/${pId}` : '/pipelines',
          label: 'Pipeline Overview',
          end: true,
          isActive: (path) =>
            path === '/pipelines' ||
            path === '/pipelines/' ||
            (Boolean(pId) && (path === `/pipelines/${pId}` || path === `/pipelines/${pId}/`)),
        },
        {
          to: pId ? `/pipelines/${pId}/board` : '/pipelines/board',
          label: 'Pipeline Board',
          isActive: (path) => path === '/pipelines/board' || path.endsWith('/board'),
        },
        {
          to: pId ? `/pipelines/${pId}/list` : '/pipelines/list',
          label: 'Pipeline List',
          isActive: (path) => path === '/pipelines/list' || path.endsWith('/list'),
        },
        {
          to: pId ? `/pipelines/${pId}/table` : '/pipelines/table',
          label: 'Pipeline Table',
          isActive: (path) => path === '/pipelines/table' || path.endsWith('/table'),
        },
        {
          to: '/pipelines/selector',
          label: 'Pipeline Selector',
          isActive: (path) => path.startsWith('/pipelines/selector'),
        },
      ],
    },
    {
      id: 'stages',
      label: 'Stages & Probability',
      links: [
        {
          to: pId ? `/pipelines/${pId}/stages` : '/pipelines/stages',
          label: 'Pipeline Stages',
          isActive: (path) =>
            (path === '/pipelines/stages' || path.endsWith('/stages')) &&
            !path.includes('stage-management'),
        },
        {
          to: pId ? `/pipelines/${pId}/stage-management` : '/pipelines/stage-management',
          label: 'Stage Management',
          isActive: (path) => path.includes('stage-management'),
        },
        {
          to: pId ? `/pipelines/${pId}/probability` : '/pipelines/probability',
          label: 'Stage Probability',
          isActive: (path) => path.includes('probability'),
        },
      ],
    },
    {
      id: 'config',
      label: 'Configuration',
      links: [
        {
          to: '/pipelines/create',
          label: 'Create Pipeline',
          isActive: (path) => path.startsWith('/pipelines/create'),
        },
        {
          to: '/pipelines/settings',
          label: 'Pipeline Settings',
          isActive: (path) => path.startsWith('/pipelines/settings') || path.endsWith('/edit'),
        },
      ],
    },
  ];
};

interface PipelinesLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  activePipeline?: Pipeline | null;
  pipelines?: Pipeline[];
  onSelectPipelineId?: (pipelineId: string) => void;
  error?: string | string[] | null;
  success?: string | null;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  children: React.ReactNode;
}

export const PipelinesLayout: React.FC<PipelinesLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
  activePipeline,
  pipelines = [],
  onSelectPipelineId,
  error,
  success,
  onDismissError,
  onDismissSuccess,
  children,
}) => {
  const location = useLocation();
  const flash = (location.state as { flash?: string } | null)?.flash;
  const [flashDismissed, setFlashDismissed] = useState(false);
  const successMessage = success || (flashDismissed ? null : flash) || null;

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  const navGroups = getPipelinesNavGroups(activePipeline);

  const checkLinkActive = (link: PipelineNavLink) => {
    if (link.isActive) {
      return link.isActive(location.pathname);
    }
    if (link.end) {
      return location.pathname === link.to;
    }
    return location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
  };

  return (
    <div className="app-layout" id="pipelines-module-shell">
      <Navbar />

      <main className="app-main-content lg-page ld-page">
        {/* Top Module Sub-Navigation: Horizontal Dropdown Navigation */}
        <nav
          ref={navRef}
          className="lg-subnav ld-subnav ld-dropdown-nav"
          aria-label="Sales Pipeline module navigation"
        >
          {navGroups.map((group) => {
            const activeItem = group.links.find((l) => checkLinkActive(l));
            const isGroupActive = Boolean(activeItem);
            const isOpen = openDropdown === group.id;

            return (
              <div key={group.id} className="ld-nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`ld-nav-dropdown-trigger ${isGroupActive ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
                  onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <span className="ld-nav-dropdown-label">{group.label}</span>
                  {activeItem && (
                    <span className="ld-nav-dropdown-active-badge">
                      {activeItem.label}
                    </span>
                  )}
                  <ChevronDownIcon
                    size={14}
                    className={`ld-nav-dropdown-chevron ${isOpen ? 'is-open' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="ld-nav-dropdown-menu" role="menu">
                    {group.links.map((link) => {
                      const isActive = checkLinkActive(link);
                      return (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          end={link.end}
                          className={`ld-nav-dropdown-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => setOpenDropdown(null)}
                          role="menuitem"
                        >
                          <span className="ld-nav-dropdown-item-label">{link.label}</span>
                          {isActive && (
                            <CheckIcon size={14} className="ld-nav-dropdown-check" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Active Pipeline Context & Selector Strip */}
        {activePipeline && (
          <div className="lg-card ld-lead-context-strip">
            <div className="ld-context-main">
              <Link to="/pipelines/selector" className="ld-context-back">
                <ArrowLeftIcon size={15} />
                <span>Pipelines</span>
              </Link>

              {pipelines.length > 1 && onSelectPipelineId ? (
                <select
                  className="lg-select ld-compact-select"
                  value={activePipeline.id}
                  onChange={(e) => onSelectPipelineId(e.target.value)}
                  aria-label="Select active sales pipeline"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="ld-context-info">
                  <strong>{activePipeline.name}</strong>
                  {activePipeline.description && (
                    <span className="lg-muted">{activePipeline.description}</span>
                  )}
                </div>
              )}

              <div className="lg-badge-row">
                {activePipeline.isDefault && <Badge tone="green">Default Pipeline</Badge>}
                <Badge tone="blue">{activePipeline.stages?.length ?? 0} Stages</Badge>
              </div>
            </div>

            <div className="ld-context-links">
              <NavLink
                to={`/pipelines/${activePipeline.id}/board`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Board
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/list`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                List
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/table`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Table
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/stages`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Stages
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/stage-management`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Stage Management
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/probability`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Stage Probability
              </NavLink>
              <NavLink
                to={`/pipelines/${activePipeline.id}/edit`}
                className={({ isActive }) => `ld-context-tab ${isActive ? 'is-active' : ''}`}
              >
                Edit Pipeline
              </NavLink>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="lg-header">
          <div className="lg-header-text">
            {breadcrumbs && <div className="lg-breadcrumbs">{breadcrumbs}</div>}
            <h1 className="lg-title">
              <span className="lg-title-icon">{icon || <TrendingUpIcon size={22} />}</span>
              <span>{title}</span>
            </h1>
            {subtitle && <p className="lg-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="lg-header-actions">{actions}</div>}
        </header>

        {/* Alert Banners */}
        {error && (
          <div className="lg-alert-wrap">
            <ErrorMessage error={error} onDismiss={onDismissError} />
          </div>
        )}
        {successMessage && (
          <div className="lg-alert-wrap">
            <SuccessMessage
              message={successMessage}
              onDismiss={() => {
                setFlashDismissed(true);
                onDismissSuccess?.();
              }}
            />
          </div>
        )}

        {children}
      </main>
    </div>
  );
};

