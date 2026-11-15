/**
 * NASA GIBS map overlays (no login needed). Layer ids, tile levels and time steps were checked against the
 * GIBS WMTS capabilities (epsg3857/best) on 2026-11-15. Imagery only: these layers are for looking, not scoring.
 */
export const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";

export type TimeStep = "day" | "month" | "none";

export interface NasaLayer {
  key: string;
  label: string;
  gibs: string;
  level: number; // GoogleMapsCompatible_Level<n>: max native zoom
  time: TimeStep;
  stepDays: number; // for "day" layers: product period (1 = daily, 8 = 8-day)
  lagDays: number; // how far behind today the newest image usually is
  steps: number; // how far back the slider goes, in steps
  what: string;
  read: string;
  caveat: string;
  legend?: string; // official GIBS legend image (used where no plain-word scale is defined)
  scale?: LegendScale; // plain-word colour key built from the GIBS colour map
}

export interface LegendScale {
  stops: string[]; // colours, evenly spaced from left to right
  low: string;
  high: string;
  ticks: { at: number; label: string }[]; // at: 0-1 along the bar
  caption: string;
}

/** Position of a value on a linear scale, for tick marks. */
const lin = (v: number, min: number, max: number) => (v - min) / (max - min);
/** Position on GPM's logarithmic rain scale (0.1 to 53 mm/hr). */
const logPos = (v: number) => (Math.log10(v) - Math.log10(0.1)) / (Math.log10(53) - Math.log10(0.1));
const rgb = (s: string) => `rgb(${s})`;

/*
 * Colour stops sampled every ~10% from NASA GIBS colour maps v1.3 (fetched 2026-11-15):
 * SMAP_Analyzed_Soil_Moisture.xml (0 to >=0.70 m3/m3), MODIS_Land_Surface_Temp.xml (<200 to >=350 K),
 * GPM_Precipitation_Rate.xml (0.1 to >=53 mm/hr, logarithmic). These are the maps GIBS links to these layers.
 */
const SOIL_SCALE: LegendScale = {
  stops: ["255,162,0", "255,222,0", "208,231,0", "59,157,0", "0,174,93", "0,252,249", "0,125,255", "0,0,241", "0,0,150", "22,22,100", "72,72,80"].map(rgb),
  low: "Dry soil",
  high: "Wet soil",
  ticks: [0, 0.2, 0.4, 0.6].map((v) => ({ at: lin(v, 0, 0.7), label: v.toFixed(1) })),
  caption: "Water in the top metre of soil (m³ of water per m³ of soil). Orange = dry, green = moist, blue = wet.",
};

const K = 273.15;
const HEAT_SCALE: LegendScale = {
  stops: ["201,0,255", "101,0,255", "1,0,255", "0,133,255", "4,255,247", "98,255,26", "189,255,0", "255,232,0", "255,157,0", "255,79,0", "255,4,0"].map(rgb),
  low: "Cold ground",
  high: "Very hot ground",
  ticks: [-50, -25, 0, 25, 50, 75].map((c) => ({ at: lin(c + K, 200, 350), label: `${c}°C` })),
  caption: "Daytime temperature of the ground surface, in °C (NASA gives Kelvin; converted here). Bare ground in summer can pass 50°C.",
};

/*
 * MODIS_NDVI.xml and SRTM_Color_Index.xml space their colours unevenly in value, so stops are taken every
 * ~10% along NASA's own colour list (as NASA's legend draws it) and ticks are placed where each value falls.
 */
const GREEN_SCALE: LegendScale = {
  stops: ["241,236,236", "229,219,205", "200,181,165", "176,149,125", "154,110,89", "150,186,32", "100,166,1", "67,141,1", "29,117,1", "0,96,1", "0,24,1"].map(rgb),
  low: "Bare or dry land",
  high: "Thick green crops",
  ticks: [
    { at: 0, label: "0" },
    { at: 0.288, label: "0.2" },
    { at: 0.525, label: "0.4" },
    { at: 0.719, label: "0.6" },
    { at: 0.863, label: "0.8" },
    { at: 1, label: "1" },
  ],
  caption: "Green cover (NDVI, 0 to 1). Brown = bare, dry or harvested land; green = growing plants; dark green = thick, healthy crops.",
};

const HEIGHT_SCALE: LegendScale = {
  stops: ["0,117,39", "0,146,58", "3,175,76", "82,196,48", "192,221,11", "206,197,10", "202,155,15", "176,92,28", "171,115,115", "194,194,194", "255,255,255"].map(rgb),
  low: "Low, flat land",
  high: "High mountains",
  ticks: [
    { at: 0, label: "0 m" },
    // "m" only on the ends: the middle ticks sit close together and would overlap on a phone.
    { at: 0.291, label: "500" },
    { at: 0.429, label: "1,000" },
    { at: 0.587, label: "2,000" },
    { at: 0.803, label: "4,000" },
    { at: 0.988, label: "8,000 m" },
  ],
  caption: "Height above sea level. Green = low, flat land; yellow and brown = hills; grey and white = high mountains.",
};

const RAIN_SCALE: LegendScale = {
  stops: ["0,118,78", "0,148,36", "30,178,0", "123,209,0", "239,237,0", "255,152,15", "255,77,45", "250,0,0", "181,0,0", "113,0,0", "51,0,0"].map(rgb),
  low: "Light rain",
  high: "Very heavy rain",
  ticks: [0.1, 1, 10, 50].map((v) => ({ at: logPos(v), label: `${v}` })),
  caption: "Rain rate in mm per hour, averaged over the day. No colour = no rain.",
};

export const NASA_LAYERS: NasaLayer[] = [
  {
    key: "ndvi",
    label: "Green cover (MODIS NDVI)",
    gibs: "MODIS_Terra_NDVI_8Day",
    level: 9,
    time: "day",
    stepDays: 8,
    lagDays: 10,
    steps: 92, // ~2 years
    what: "How much living green vegetation there was, as an 8-day composite at 250 m.",
    read: "Greener means more growing plants; pale or brown means bare, dry or harvested land. Slide through the year to see when fields are green and when they lie bare.",
    caveat: "It cannot tell crop residue from bare soil, and one pixel is bigger than most fields.",
    scale: GREEN_SCALE,
  },
  {
    key: "rain",
    label: "Rainfall (GPM IMERG)",
    gibs: "IMERG_Precipitation_Rate",
    level: 6,
    time: "day",
    stepDays: 1,
    lagDays: 2,
    steps: 365,
    what: "Rain on the chosen day from NASA's GPM satellites (IMERG, about 10 km).",
    read: "Coloured areas had rain that day; stronger colours mean heavier rain. Slide day by day to find storms and dry spells.",
    caveat: "A satellite estimate for the whole area, not a rain-gauge reading at your field.",
    scale: RAIN_SCALE,
  },
  {
    key: "soil",
    label: "Soil moisture (SMAP)",
    gibs: "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture",
    level: 6,
    time: "day",
    stepDays: 1,
    lagDays: 5,
    steps: 365,
    what: "Water in the root zone (top metre of soil) from SMAP Level 4, about 9 km.",
    read: "Compare wetter and drier areas and how they change after rain or irrigation seasons.",
    caveat: "A model analysis that uses satellite data, not a measurement in your field. Some days have no image.",
    scale: SOIL_SCALE,
  },
  {
    key: "heat",
    label: "Ground heat (MODIS land temperature)",
    gibs: "MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day",
    level: 6,
    time: "month",
    stepDays: 0,
    lagDays: 45,
    steps: 36,
    what: "Average daytime temperature of the ground surface for the month (MODIS Terra).",
    read: "Shows heat hot spots and how the hot season builds month by month.",
    caveat: "Ground-surface temperature, not air temperature; bare ground heats more than crops. ECOSTRESS gives field-scale detail but needs an Earthdata login.",
    scale: HEAT_SCALE,
  },
  {
    key: "elevation",
    label: "Elevation and slope (SRTM)",
    gibs: "SRTM_Color_Index",
    level: 12,
    time: "none",
    stepDays: 0,
    lagDays: 0,
    steps: 0,
    what: "Height above sea level from the Shuttle Radar Topography Mission.",
    read: "Where colours change quickly over a short distance the land slopes: rain runs off faster and soil erodes more easily there.",
    caveat: "Elevation only; erosion risk also depends on soil, rain intensity and ground cover.",
    scale: HEIGHT_SCALE,
  },
];

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Date for slider position `back` (0 = newest image). */
export function layerDate(layer: NasaLayer, back: number, today = new Date()): string | null {
  if (layer.time === "none") return null;
  const newest = new Date(today.getTime() - layer.lagDays * 86400000);
  if (layer.time === "month") {
    return iso(new Date(Date.UTC(newest.getUTCFullYear(), newest.getUTCMonth() - back, 1)));
  }
  return iso(new Date(newest.getTime() - back * layer.stepDays * 86400000));
}

export function tileUrl(layer: NasaLayer, date: string | null): string {
  return `${GIBS}/${layer.gibs}/default/${date ?? "default"}/GoogleMapsCompatible_Level${layer.level}/{z}/{y}/{x}.png`;
}

/** NASA Worldview shows the same layer with its official colour key. */
export function worldviewUrl(layer: NasaLayer, date: string | null, lat: number, lon: number): string {
  const v = [lon - 4, lat - 3, lon + 4, lat + 3].map((n) => n.toFixed(2)).join(",");
  const params = new URLSearchParams({ v, l: `${layer.gibs},Coastlines_15m,Reference_Labels_15m` });
  if (date) params.set("t", date);
  return `https://worldview.earthdata.nasa.gov/?${params}`;
}

export const dateLabel = (layer: NasaLayer, date: string | null) =>
  date == null
    ? "Single map (no dates)"
    : new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
        day: layer.time === "month" ? undefined : "numeric",
        month: "long",
        year: "numeric",
      });
