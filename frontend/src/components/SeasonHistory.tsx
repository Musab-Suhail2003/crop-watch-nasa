import { ErrorBox, List } from "./common";
import type { Loadable } from "../hooks/useDashboardData";
import { CROP_IMAGE, ILLUSTRATIONS, RISK_IMAGE } from "../lib/illustrations";
import { LEVEL_LABEL, RISK_LABEL, cropLabel, fmt } from "../lib/labels";
import type { HistoryResult, RiskType, SeasonHistory as Season } from "../types";

const RISKS: RiskType[] = ["heat", "cold", "drought", "waterlogging", "disease"];

const monthDay = (md: string) =>
  new Date(`2000-${md}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** How often a risk reached High, as a plain word and colour. */
function howOften(share: number): { word: string; cls: string } {
  if (share >= 0.5) return { word: "Most years", cls: "high" };
  if (share >= 0.2) return { word: "Some years", cls: "moderate" };
  if (share > 0) return { word: "Rarely", cls: "low" };
  return { word: "Never", cls: "low" };
}

function trendText(perDecade: number | null): string | null {
  if (perDecade == null || Math.abs(perDecade) < 0.5) return null;
  return perDecade > 0 ? "↑ getting more common" : "↓ getting less common";
}

/** Year-by-year grid: each square is one past season, coloured by the worst level reached. */
function YearGrid({ season }: { season: Season }) {
  const years = season.per_year;
  return (
    <div className="table-wrap">
      <table className="yeargrid">
        <thead>
          <tr>
            <th scope="col">Risk</th>
            {years.map((y, i) => (
              <th key={y.sowing_year} scope="col" className="yr">
                {i === 0 || i === years.length - 1 || y.sowing_year % 5 === 0 ? `'${String(y.sowing_year).slice(2)}` : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RISKS.map((risk) => (
            <tr key={risk}>
              <th scope="row">{RISK_LABEL[risk]}</th>
              {years.map((y) => {
                const level = y.levels[risk];
                const label = level ? LEVEL_LABEL[level] : "Not checked";
                return (
                  <td
                    key={y.sowing_year}
                    className={`cell ${level ?? "na"}`}
                    title={`${y.sowing_year}: ${label}${level ? `, ${y.high_days[risk]} high days` : ""}`}
                    aria-label={`${y.sowing_year}: ${label}`}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One crop season: picture rows saying how often each risk hit hard in the past 20 years. */
function SeasonCard({ season }: { season: Season }) {
  return (
    <div className="dcard pad season-hist">
      <div className="chart-title">
        <img src={CROP_IMAGE[season.crop]} alt="" />
        <div>
          <h3>{cropLabel(season.crop)}</h3>
          <p>
            Sown {monthDay(season.sowing_month_day)}, harvested {monthDay(season.harvest_month_day)}
          </p>
        </div>
      </div>

      <div className="hist-rows">
        {RISKS.map((risk) => {
          const h = season.risks.find((r) => r.risk === risk);
          const checked = !!h && h.years_assessed > 0;
          const share = checked ? h!.years_high / h!.years_assessed : 0;
          const often = howOften(share);
          return (
            <div key={risk} className="hist-row">
              <img src={RISK_IMAGE[risk]} alt="" />
              <div className="meter-body">
                <div className="meter-top">
                  <span>{RISK_LABEL[risk]}</span>
                  <strong className={checked ? `risk-word ${often.cls}` : "muted"}>
                    {checked ? `${often.word} · ${h!.years_high} of ${h!.years_assessed}` : "Not checked yet"}
                  </strong>
                </div>
                <div className="meter-track" aria-hidden="true">
                  {checked && <span className={`fill ${often.cls}`} style={{ width: `${Math.max(3, share * 100)}%` }} />}
                </div>
                {checked && trendText(h!.high_days_trend_per_decade) && (
                  <small className="muted">{trendText(h!.high_days_trend_per_decade)}</small>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {season.water && (
        <p className="hist-water">
          <img src={ILLUSTRATIONS.droplet} alt="" />
          <span>
            Water it needs: about <strong>{fmt(season.water.median_irrigation_need_mm)} mm</strong> in a normal year,
            more than <strong>{fmt(season.water.p80_irrigation_need_mm)} mm</strong> in 1 year out of 5.
          </span>
        </p>
      )}

      <details className="layer-more">
        <summary>See every year</summary>
        <div className="legend small" aria-hidden="true">
          <span><i className="cell low" /> Low</span>
          <span><i className="cell moderate" /> Moderate</span>
          <span><i className="cell high" /> High</span>
          <span><i className="cell na" /> Not checked</span>
        </div>
        <YearGrid season={season} />
        <List items={season.notes} />
      </details>
    </div>
  );
}

export default function SeasonHistory({
  history,
  rotationName,
}: {
  history: Loadable<HistoryResult>;
  rotationName: string;
}) {
  return (
    <section id="season-history">
      <div className="step-head">
        <img className="step-img" src={ILLUSTRATIONS.calendar} alt="" />
        <div>
          <h2>The last 20 years</h2>
          <p>How often bad weather hit {rotationName}, if planted on the same dates each year. This is the past, not a forecast.</p>
        </div>
      </div>
      {history.loading && <p className="muted">Looking back over 20 years of NASA weather… this can take a minute.</p>}
      <ErrorBox error={history.error ? "We could not load the past 20 years right now. Please try again later." : null} />
      {history.data && (
        <>
          <div className="hist-grid">
            {history.data.seasons.map((s) => (
              <SeasonCard key={`${s.crop}-${s.sowing_month_day}`} season={s} />
            ))}
          </div>
          <details className="layer-more">
            <summary>How this is worked out</summary>
            <List items={history.data.summary} />
            <List items={history.data.method} />
          </details>
        </>
      )}
    </section>
  );
}
