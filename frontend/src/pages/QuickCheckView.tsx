import { useEffect, useState } from "react";
import { AdviceList, DataNoteLine, ErrorBox, List } from "../components/common";
import { CROP_IMAGE, ILLUSTRATIONS, RISK_IMAGE } from "../lib/illustrations";
import { CROPS, LEVEL_LABEL, RISK_LABEL, STAGES, cropLabel, fmt, stageLabel } from "../lib/labels";
import { api } from "../services/api";
import type { CropName, Location, QuickCheckResult, RiskLevel, StageType } from "../types";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function verdict(level: RiskLevel | null, crop: string): string {
  if (level === null) return `We could not check your ${crop.toLowerCase()} yet`;
  if (level === "low") return `Your ${crop.toLowerCase()} looks safe this week`;
  if (level === "moderate") return `Keep an eye on your ${crop.toLowerCase()}`;
  return `Your ${crop.toLowerCase()} is at risk this week`;
}

const dayName = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });

export default function QuickCheckView({ location, urdu }: { location: Location; urdu: boolean }) {
  const [crop, setCrop] = useState<CropName>("wheat");
  const [mode, setMode] = useState<"date" | "stage">("date");
  const [sowing, setSowing] = useState(daysAgo(20));
  const [stage, setStage] = useState<StageType>("vegetative");
  const [result, setResult] = useState<QuickCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Growth stages each crop's profile actually defines (only these can be checked).
  const [cropStages, setCropStages] = useState<Partial<Record<CropName, StageType[]>>>({});

  useEffect(() => {
    api
      .cropProfiles()
      .then((ps) => setCropStages(Object.fromEntries(ps.map((p) => [p.crop, p.stages.map((s) => s.stage_type)]))))
      .catch(() => setCropStages({}));
  }, []);

  const stagesForCrop = STAGES.filter((s) => cropStages[crop]?.includes(s.value));
  useEffect(() => {
    // Switching crop: keep the picked stage only if the new crop has it.
    if (stagesForCrop.length && !stagesForCrop.some((s) => s.value === stage)) setStage(stagesForCrop[0].value);
  }, [crop, stagesForCrop, stage]);
  const stageUnavailable = mode === "stage" && !stagesForCrop.some((s) => s.value === stage);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await api.quickCheck({
          location,
          crop,
          ...(mode === "date" ? { sowing_date: sowing } : { stage }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="quick">
      <div className="dcard pad quick-form">
        <p className="layer-ask">Which crop?</p>
        <div className="crop-pick" role="radiogroup" aria-label="Crop">
          {CROPS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={crop === c.value}
              className={`layer-btn${crop === c.value ? " on" : ""}`}
              onClick={() => setCrop(c.value)}
            >
              <img src={CROP_IMAGE[c.value]} alt="" />
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        <div className="quick-when">
          {mode === "date" ? (
            <label className="field">
              When did you sow it?
              <input type="date" value={sowing} max={daysAgo(0)} onChange={(e) => setSowing(e.target.value)} />
            </label>
          ) : (
            <label className="field">
              How far has it grown?
              <select
                value={stage}
                disabled={!stagesForCrop.length}
                onChange={(e) => setStage(e.target.value as StageType)}
              >
                {!stagesForCrop.length && <option value={stage}>Loading…</option>}
                {stagesForCrop.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="link-btn" onClick={() => setMode(mode === "date" ? "stage" : "date")}>
            {mode === "date" ? "I don’t know the date" : "I know the sowing date"}
          </button>
        </div>

        <button className="primary big" onClick={run} disabled={loading || stageUnavailable}>
          {loading ? "Checking with NASA weather…" : "Check my crop"}
        </button>
      </div>

      <ErrorBox error={error ? "We could not check your crop right now. Please try again." : null} />

      {result && (
        <>
          <div className={`dcard verdict ${result.overall ?? "na"}`}>
            <img src={CROP_IMAGE[result.crop]} alt="" />
            <div>
              <strong>{verdict(result.overall, cropLabel(result.crop))}</strong>
              <p>
                {result.overall === null
                  ? "No checked limit exists for this crop at this stage yet. This is not a “no risk” answer."
                  : result.cards.length === 0
                    ? "No danger found in the last 7 days."
                    : "See what to watch below."}
                {result.stage && ` Growth stage: ${stageLabel(result.stage)}.`}
              </p>
            </div>
          </div>

          {result.cards.length > 0 && (
            <div className="risk-grid">
              {result.cards.map((c) => (
                <div key={c.risk} className={`dcard risk-card ${c.level}`}>
                  <img src={RISK_IMAGE[c.risk]} alt="" />
                  <div>
                    <strong>{RISK_LABEL[c.risk]}</strong>
                    <span className={`risk-word ${c.level}`}>{LEVEL_LABEL[c.level]} risk</span>
                    <p>{c.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.advice.length > 0 && (
            <div className="dcard pad tips">
              <div className="chart-title">
                <img src={ILLUSTRATIONS.seedling} alt="" />
                <h3>What you can do</h3>
              </div>
              <AdviceList tips={result.advice} urdu={urdu} />
            </div>
          )}

          <div className="dcard pad">
            <h3 style={{ marginTop: 0 }}>The last 7 days</h3>
            <div className="week-strip">
              {result.last_7_days.map((d) => (
                <div key={d.day} className="day">
                  <span className="day-name">{dayName(d.day)}</span>
                  <img src={(d.precipitation_mm ?? 0) >= 1 ? ILLUSTRATIONS.rain : ILLUSTRATIONS.sun} alt="" />
                  <strong>{fmt(d.tmax_c, 0)}°</strong>
                  <span className="muted">{fmt(d.tmin_c, 0)}°</span>
                  <span className="day-rain">{fmt(d.precipitation_mm, 0)} mm</span>
                </div>
              ))}
            </div>
            <details className="layer-more">
              <summary>More about this check</summary>
              <p className="small">{result.stage_basis}</p>
              {result.not_assessed.length > 0 && (
                <p className="small">
                  Not checked (no proven limit for this crop and stage yet):{" "}
                  {result.not_assessed.map((r) => RISK_LABEL[r]).join(", ")}.
                </p>
              )}
              <List items={result.notes.filter((n) => !n.startsWith("Not assessed:"))} />
              <DataNoteLine note={result.data_note} />
            </details>
          </div>
        </>
      )}
    </div>
  );
}
