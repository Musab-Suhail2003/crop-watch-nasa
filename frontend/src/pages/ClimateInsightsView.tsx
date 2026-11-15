import type { ReactNode } from "react";
import { DataNoteLine, ErrorBox, LineChart } from "../components/common";
import SeasonHistory from "../components/SeasonHistory";
import { ClimateYearChart } from "../components/dashboard/visuals";
import type { Loadable } from "../hooks/useDashboardData";
import { monthlySeries, yearFigures } from "../lib/climateSummary";
import { ILLUSTRATIONS } from "../lib/illustrations";
import { fmt } from "../lib/labels";
import type { EnvironmentalData, HistoryResult, Location } from "../types";
import QuickCheckView from "./QuickCheckView";

/** Section heading with a picture, the same as on the other pages. */
function StepHead({ image, title, text }: { image: string; title: string; text: string }) {
  return (
    <div className="step-head">
      <img className="step-img" src={image} alt="" />
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function ClimateInsightsView({
  weather,
  location,
  urdu,
  header,
  history,
  rotationName,
}: {
  weather: Loadable<EnvironmentalData>;
  history: Loadable<HistoryResult>;
  rotationName: string;
  location: Location;
  urdu: boolean;
  header?: ReactNode; // e.g. the farm line, shown under the title
}) {
  const obs = weather.data?.observations ?? [];
  const latest = weather.data?.data_note.latest_observation_date ?? null;
  const months = weather.data ? monthlySeries(obs, latest) : [];
  const year = weather.data ? yearFigures(obs, latest) : null;

  return (
    <div className="weather-page">
      <div className="welcome">
        <div>
          <h1>Weather</h1>
          <p className="sub">Your farm’s weather this week, this year and over 20 years. Past weather, not a forecast.</p>
          {header}
        </div>
      </div>

      <section>
        <StepHead
          image={ILLUSTRATIONS.plant}
          title="Is my crop safe this week?"
          text="Checks the last 7 days of NASA weather against what your crop can take."
        />
        <QuickCheckView location={location} urdu={urdu} />
      </section>

      <section>
        <StepHead image={ILLUSTRATIONS.climate} title="This year’s weather" text="The past 12 months on your farm." />
        {weather.loading && <div className="skeleton chart-skeleton" />}
        <ErrorBox error={weather.error ? "We could not load the weather right now. Please try again." : null} />
        {weather.data && (
          <>
            <div className="dcard pad" id="trend-temp">
              <div className="dash-head inline">
                <h3 style={{ margin: 0 }}>Rain and temperature</h3>
                <div className="chart-legend-big">
                  <span>
                    <i className="key rain" /> Rain (mm)
                  </span>
                  <span>
                    <i className="key temp" /> Temperature (°C)
                  </span>
                </div>
              </div>
              <ClimateYearChart months={months} />
              {year?.rainTotalMm != null && (
                <p className="year-total">
                  <img src={ILLUSTRATIONS.rain} alt="" /> Rain in the past 12 months: <strong>{fmt(year.rainTotalMm)} mm</strong>
                </p>
              )}
            </div>
            <div className="farm-charts" style={{ marginTop: 16 }}>
              <div className="dcard pad" id="trend-humidity">
                <div className="chart-title">
                  <img src={ILLUSTRATIONS.droplet} alt="" />
                  <div>
                    <h3>Air moisture</h3>
                    <p>Long damp spells can bring crop diseases.</p>
                  </div>
                </div>
                <LineChart
                  unit="%"
                  color="var(--chart-2)"
                  digits={0}
                  points={months.map((m) => ({ x: m.month, y: m.avgHumidityPct }))}
                />
              </div>
              <div className="dcard pad" id="trend-solar">
                <div className="chart-title">
                  <img src={ILLUSTRATIONS.sun} alt="" />
                  <div>
                    <h3>Sunshine</h3>
                    <p>Sunlight that crops use to grow.</p>
                  </div>
                </div>
                <LineChart
                  unit="kWh/m² a day"
                  color="var(--chart-3)"
                  digits={1}
                  points={months.map((m) => ({ x: m.month, y: m.avgSolarKwh }))}
                />
              </div>
            </div>
          </>
        )}
      </section>

      <SeasonHistory history={history} rotationName={rotationName} />

      {weather.data && (
        <details className="layer-more">
          <summary>About this weather data</summary>
          <DataNoteLine note={weather.data.data_note} />
        </details>
      )}
    </div>
  );
}
