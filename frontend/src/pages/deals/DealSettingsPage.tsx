import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dealService, DEFAULT_DEAL_SETTINGS } from '../../services/deal.service';
import type { DealModuleSettings, DealViewMode } from '../../types/deal.types';
import { DealsLayout } from './components/DealsLayout';
import { CURRENCY_OPTIONS } from './dealConstants';
import { SectionCard } from '../lead-generation/components/Cards';
import { Field } from '../lead-generation/components/FormParts';
import { ArrowLeftIcon } from '../../components/common/Icons';

export const DealSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<DealModuleSettings>(() =>
    dealService.getLocalSettings(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    dealService
      .getSettings()
      .then((res) => {
        if (active) setSettings(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const saved = await dealService.saveSettings(settings);
      setSettings(saved);
      setBannerMessage('Deal module settings saved.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save deal settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSettings({ ...DEFAULT_DEAL_SETTINGS });
    await dealService.saveSettings({ ...DEFAULT_DEAL_SETTINGS });
    setBannerMessage('Deal module settings restored to defaults.');
  };

  return (
    <DealsLayout
      title="Deal Settings"
      subtitle="Configure default deal views, currencies, win probability defaults, weighted value forecasting, and outcome rules."
      error={error}
      success={bannerMessage}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setBannerMessage(null)}
      actions={
        <div className="lg-badge-row">
          <Link
            to="/pipelines/settings"
            className="auth-btn btn-secondary btn-size-small"
          >
            Pipeline Stage Settings
          </Link>
          <Link to="/deals" className="auth-btn btn-secondary btn-size-small">
            <ArrowLeftIcon size={15} /> Back to Deals
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSave} className="ld-cards-stack">
        <SectionCard
          title="Default Display & Forecasting Preferences"
          subtitle="Control how deals are displayed across Table, List, and Board views."
        >
          <div className="lg-form-grid">
            <Field label="Default Deal View" htmlFor="deal-setting-view">
              <select
                id="deal-setting-view"
                className="lg-select"
                value={settings.defaultView}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultView: e.target.value as DealViewMode,
                  }))
                }
              >
                <option value="table">Table View (High-Density)</option>
                <option value="list">List View (Detailed Deal Cards)</option>
                <option value="board">Board View (Kanban Stage Columns)</option>
              </select>
            </Field>

            <Field label="Default Deal Currency" htmlFor="deal-setting-currency">
              <select
                id="deal-setting-currency"
                className="lg-select"
                value={settings.defaultCurrency}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultCurrency: e.target.value,
                  }))
                }
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={`Default Initial Win Probability (${settings.defaultProbability}%)`}
              htmlFor="deal-setting-prob"
            >
              <input
                id="deal-setting-prob"
                type="number"
                min={0}
                max={100}
                className="lg-input"
                value={settings.defaultProbability}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultProbability: Math.min(
                      100,
                      Math.max(0, Number(e.target.value) || 0),
                    ),
                  }))
                }
              />
            </Field>

            <Field label="Default Page Size" htmlFor="deal-setting-pagesize">
              <select
                id="deal-setting-pagesize"
                className="lg-select"
                value={settings.pageSize}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    pageSize: Number(e.target.value) || 10,
                  }))
                }
              >
                <option value={10}>10 deals per page</option>
                <option value={20}>20 deals per page</option>
                <option value={50}>50 deals per page</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Revenue Forecasting & Outcome Governance"
          subtitle="Manage weighted pipeline calculation and Won/Lost outcome recording behavior."
        >
          <div className="ld-form-stack">
            <label className="lg-badge-row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="ld-checkbox"
                checked={settings.showWeightedValue}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    showWeightedValue: e.target.checked,
                  }))
                }
              />
              <span>
                <strong>Show Weighted Forecast Values</strong> — Display probability-weighted
                revenue alongside raw deal values in Table, List, and Board views.
              </span>
            </label>

            <label className="lg-badge-row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="ld-checkbox"
                checked={settings.requireNoteOnLost}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    requireNoteOnLost: e.target.checked,
                  }))
                }
              />
              <span>
                <strong>Prompt for Post-Mortem Note on Lost Deals</strong> — Encourage reps to
                document loss reasons when marking deals as LOST.
              </span>
            </label>

            <label className="lg-badge-row" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="ld-checkbox"
                checked={settings.celebrateWonDeals}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    celebrateWonDeals: e.target.checked,
                  }))
                }
              />
              <span>
                <strong>Highlight Closed-Won Milestones</strong> — Show confirmation banners
                and win metrics when deals are closed as WON.
              </span>
            </label>
          </div>

          <div className="ld-form-actions" style={{ marginTop: '1.25rem' }}>
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={handleResetDefaults}
            >
              Restore Defaults
            </button>
            <button
              type="submit"
              className="auth-btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Settings...' : 'Save Deal Settings'}
            </button>
          </div>
        </SectionCard>
      </form>
    </DealsLayout>
  );
};

export default DealSettingsPage;
