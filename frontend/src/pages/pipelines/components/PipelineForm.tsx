import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type {
  CreatePipelinePayload,
  CreatePipelineStagePayload,
  Pipeline,
} from '../../../types/pipeline.types';
import { Field, Toggle } from '../../lead-generation/components/FormParts';
import { Badge } from '../../lead-generation/components/Cards';
import { PrimaryButton } from '../../../components/auth/PrimaryButton';
import {
  DEFAULT_STARTER_STAGES,
  STAGE_COLOR_PRESETS,
} from '../pipelineConstants';
import { PlusIcon, TrashIcon } from '../../../components/common/Icons';

interface PipelineFormProps {
  initialPipeline?: Partial<Pipeline> | null;
  includeInitialStages?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelPath?: string;
  onSubmit: (
    payload: CreatePipelinePayload,
    initialStages: CreatePipelineStagePayload[],
  ) => Promise<void>;
}

export const PipelineForm: React.FC<PipelineFormProps> = ({
  initialPipeline,
  includeInitialStages = false,
  isSubmitting = false,
  submitLabel = 'Save Pipeline',
  cancelPath = '/pipelines',
  onSubmit,
}) => {
  const [name, setName] = useState(initialPipeline?.name || '');
  const [description, setDescription] = useState(initialPipeline?.description || '');
  const [isDefault, setIsDefault] = useState(Boolean(initialPipeline?.isDefault));
  const [seedStages, setSeedStages] = useState(includeInitialStages);
  const [draftStages, setDraftStages] = useState<CreatePipelineStagePayload[]>(
    DEFAULT_STARTER_STAGES,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) {
      next.name = 'Pipeline name is required.';
    } else if (name.trim().length < 2) {
      next.name = 'Pipeline name must be at least 2 characters.';
    }

    if (includeInitialStages && seedStages) {
      const invalidStage = draftStages.find((s) => !s.name.trim());
      if (invalidStage) {
        next.stages = 'Every stage must have a name.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpdateDraftStage = (
    idx: number,
    patch: Partial<CreatePipelineStagePayload>,
  ) => {
    setDraftStages((prev) =>
      prev.map((st, i) => (i === idx ? { ...st, ...patch } : st)),
    );
  };

  const handleAddDraftStage = () => {
    const nextOrder = draftStages.length + 1;
    setDraftStages((prev) => [
      ...prev,
      {
        name: `Stage ${nextOrder}`,
        order: nextOrder,
        winProbability: Math.min(100, nextOrder * 20),
        color: STAGE_COLOR_PRESETS[nextOrder % STAGE_COLOR_PRESETS.length].value,
      },
    ]);
  };

  const handleRemoveDraftStage = (idx: number) => {
    setDraftStages((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((st, newIdx) => ({ ...st, order: newIdx + 1 })),
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreatePipelinePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      isDefault,
    };

    const stagesToCreate =
      includeInitialStages && seedStages
        ? draftStages.map((s, idx) => ({
            name: s.name.trim(),
            order: idx + 1,
            winProbability: Math.max(0, Math.min(100, Number(s.winProbability ?? 10))),
            color: s.color || '#3b82f6',
          }))
        : [];

    await onSubmit(payload, stagesToCreate);
  };

  return (
    <form className="lg-card lg-form-card" onSubmit={handleFormSubmit} noValidate>
      <h2 className="lg-form-section-title">1. Pipeline Identity & Default Behaviour</h2>

      <div className="lg-form-grid">
        <Field
          label="Pipeline Name"
          htmlFor="pipeline-name"
          required
          error={errors.name}
          className="lg-span-2"
          hint="E.g. Enterprise B2B Sales, SaaS Inbound Pipeline, Partner Channel Pipeline."
        >
          <input
            id="pipeline-name"
            className="lg-input"
            placeholder="e.g. Enterprise Outbound Pipeline"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
          />
        </Field>

        <Field
          label="Pipeline Description"
          htmlFor="pipeline-description"
          className="lg-span-2"
        >
          <textarea
            id="pipeline-description"
            className="lg-textarea"
            rows={3}
            placeholder="Describe which deals, territories, or revenue streams belong in this pipeline..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="lg-span-2">
          <Toggle
            id="pipeline-is-default"
            checked={isDefault}
            onChange={setIsDefault}
            label="Set as Default Sales Pipeline"
            description="New deals and lead conversions will automatically use this pipeline unless another is chosen."
          />
        </div>
      </div>

      {includeInitialStages && (
        <>
          <h2 className="lg-form-section-title">2. Initial Pipeline Stages & Probabilities</h2>

          <div className="ld-form-stack">
            <Toggle
              id="pipeline-seed-stages"
              checked={seedStages}
              onChange={setSeedStages}
              label="Initialize with Starter Stages"
              description="Automatically create ordered pipeline stages with win probabilities right after creating the pipeline."
            />

            {errors.stages && <div className="lg-inline-alert">{errors.stages}</div>}

            {seedStages && (
              <div className="ld-items-stack">
                {draftStages.map((stage, idx) => (
                  <div key={idx} className="ld-subcard">
                    <div className="ld-subcard-top">
                      <div className="lg-badge-row">
                        <Badge tone="blue">Stage #{idx + 1}</Badge>
                        <strong>{stage.name || 'Unnamed Stage'}</strong>
                      </div>
                      {draftStages.length > 1 && (
                        <button
                          type="button"
                          className="lg-icon-btn danger"
                          onClick={() => handleRemoveDraftStage(idx)}
                          title="Remove stage"
                        >
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </div>

                    <div className="lg-form-grid">
                      <Field label="Stage Name" htmlFor={`draft-stage-name-${idx}`} required>
                        <input
                          id={`draft-stage-name-${idx}`}
                          className="lg-input"
                          value={stage.name}
                          onChange={(e) =>
                            handleUpdateDraftStage(idx, { name: e.target.value })
                          }
                        />
                      </Field>

                      <Field
                        label={`Win Probability (${stage.winProbability ?? 10}%)`}
                        htmlFor={`draft-stage-prob-${idx}`}
                      >
                        <input
                          id={`draft-stage-prob-${idx}`}
                          type="number"
                          min={0}
                          max={100}
                          className="lg-input"
                          value={stage.winProbability ?? 10}
                          onChange={(e) =>
                            handleUpdateDraftStage(idx, {
                              winProbability: Math.max(
                                0,
                                Math.min(100, Number(e.target.value) || 0),
                              ),
                            })
                          }
                        />
                      </Field>

                      <Field
                        label="Stage Color"
                        htmlFor={`draft-stage-color-${idx}`}
                        className="lg-span-2"
                      >
                        <select
                          id={`draft-stage-color-${idx}`}
                          className="lg-select"
                          value={stage.color || '#3b82f6'}
                          onChange={(e) =>
                            handleUpdateDraftStage(idx, { color: e.target.value })
                          }
                        >
                          {STAGE_COLOR_PRESETS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    className="auth-btn btn-secondary"
                    onClick={handleAddDraftStage}
                  >
                    <PlusIcon size={15} />
                    <span>Add Another Stage</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="lg-form-footer">
        <Link to={cancelPath} className="auth-btn btn-secondary">
          Cancel
        </Link>
        <div className="ld-submit-btn-wrap">
          <PrimaryButton type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
};

