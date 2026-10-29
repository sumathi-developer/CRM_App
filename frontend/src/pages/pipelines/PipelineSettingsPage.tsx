import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DEFAULT_PIPELINE_SETTINGS,
  pipelineService,
} from '../../services/pipeline.service';
import type {
  Pipeline,
  PipelineModuleSettings,
  PipelineViewMode,
} from '../../types/pipeline.types';
import { SectionCard } from '../lead-generation/components/Cards';
import { Field, Toggle } from '../lead-generation/components/FormParts';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { PipelinesLayout } from './components/PipelinesLayout';
import { ArrowLeftIcon, SlidersIcon } from '../../components/common/Icons';

export const PipelineSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PipelineModuleSettings>(() =>
    pipelineService.getLocalSettings(),
  );
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [defaultPipelineId, setDefaultPipelineId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([pipelineService.getSettings(), pipelineService.getPipelines()])
      .then(([cfg, pipeList]) => {
        if (!mounted) return;
        setSettings(cfg);
        setPipelines(pipeList);
        const def = pipeList.find((p) => p.isDefault) || pipeList[0];
        setDefaultPipelineId(def?.id || '');
      })
      .catch((err: any) => {
        if (mounted) setError(err?.message || 'Failed to load pipeline settings.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await pipelineService.saveSettings(settings);
      if (defaultPipelineId) {
        const currentDefault = pipelines.find((p) => p.isDefault);
        if (!currentDefault || currentDefault.id !== defaultPipelineId) {
          await pipelineService.updatePipeline(defaultPipelineId, { isDefault: true });
        }
        pipelineService.setSavedPipelineId(defaultPipelineId);
      }
      setSuccess('Sales Pipeline module settings saved.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSettings({ ...DEFAULT_PIPELINE_SETTINGS });
    await pipelineService.saveSettings({ ...DEFAULT_PIPELINE_SETTINGS });
    setSuccess('Reset Sales Pipeline settings to workspace defaults.');
  };

  return (
    <PipelinesLayout
      title="Pipeline Settings"
      subtitle="Configure default sales pipeline, board preferences, weighted revenue forecasting, and stage behavior."
      icon={<SlidersIcon size={22} />}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      breadcrumbs={
        <Link to="/pipelines" className="lg-link-btn">
          <ArrowLeftIcon size={14} /> Back to Pipeline Overview
        </Link>
      }
    >
      {isLoading ? (
        <div className="lg-card lg-state-box">
          <LoadingIndicator size="large" message="Loading pipeline settings..." />
        </div>
      ) : (
        <form className="ld-form-stack" onSubmit={handleSave}>
          <SectionCard
            title="1. Default Pipeline & View Preferences"
            subtitle="Choose which pipeline and view mode open by default in the Sales Pipeline workspace."
          >
            <div className="lg-form-grid">
              <Field label="Workspace Default Pipeline" htmlFor="pipe-set-default-id">
                <select
                  id="pipe-set-default-id"
                  className="lg-select"
                  value={defaultPipelineId}
                  onChange={(e) => setDefaultPipelineId(e.target.value)}
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stages?.length ?? 0} stages)
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Default Pipeline View" htmlFor="pipe-set-default-view">
                <select
                  id="pipe-set-default-view"
                  className="lg-select"
                  value={settings.defaultView}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultView: e.target.value as PipelineViewMode,
                    }))
                  }
                >
                  <option value="overview">Pipeline Overview (Funnel + Board)</option>
                  <option value="board">Pipeline Board (Kanban)</option>
                  <option value="list">Pipeline List (Grouped by Stage)</option>
                  <option value="table">Pipeline Table</option>
                </select>
              </Field>

              <Field label="Default Currency" htmlFor="pipe-set-currency">
                <select
                  id="pipe-set-currency"
                  className="lg-select"
                  value={settings.defaultCurrency}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, defaultCurrency: e.target.value }))
                  }
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </Field>

              <Field
                label="Stagnant / Rotten Deal Threshold (Days)"
                htmlFor="pipe-set-rotten-days"
                hint="Highlight open deals that remain in a stage longer than this threshold."
              >
                <input
                  id="pipe-set-rotten-days"
                  type="number"
                  min={1}
                  max={365}
                  className="lg-input"
                  value={settings.rottenDealDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      rottenDealDays: Math.max(1, Number(e.target.value) || 30),
                    }))
                  }
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="2. Stage Probability & Board Behavior"
            subtitle="Control how stage probabilities, weighted deal forecasts, and drag-and-drop behave."
          >
            <div className="ld-form-stack">
              <Toggle
                id="pipe-set-weighted"
                checked={settings.showWeightedValue}
                onChange={(checked) =>
                  setSettings((prev) => ({ ...prev, showWeightedValue: checked }))
                }
                label="Display Weighted Revenue Forecast"
                description="Show stage-weighted deal value (Deal Value × Stage Win Probability %) on deal cards, columns, and tables."
              />

              <Toggle
                id="pipe-set-prob-bar"
                checked={settings.showStageProbabilityBar}
                onChange={(checked) =>
                  setSettings((prev) => ({ ...prev, showStageProbabilityBar: checked }))
                }
                label="Show Visual Stage Probability Progress Bars"
                description="Render color-coded probability bars alongside stage badges in list and table views."
              />

              <Toggle
                id="pipe-set-dnd"
                checked={settings.enableDragAndDrop}
                onChange={(checked) =>
                  setSettings((prev) => ({ ...prev, enableDragAndDrop: checked }))
                }
                label="Enable Kanban Drag-and-Drop Stage Movement"
                description="Allow users to drag deal cards across stage columns on the Pipeline Board."
              />

              <Toggle
                id="pipe-set-autosync"
                checked={settings.autoSyncProbabilityWithStage}
                onChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoSyncProbabilityWithStage: checked,
                  }))
                }
                label="Automatically Sync Deal Probability with Stage Probability"
                description="When a deal moves to a new stage, update its win probability to match that stage's configured probability."
              />
            </div>
          </SectionCard>

          <div className="lg-form-footer">
            <button
              type="button"
              className="auth-btn btn-secondary"
              onClick={handleResetDefaults}
            >
              Reset to Defaults
            </button>
            <div className="ld-submit-btn-wrap">
              <PrimaryButton type="submit" isLoading={isSaving}>
                Save Pipeline Settings
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}
    </PipelinesLayout>
  );
};

