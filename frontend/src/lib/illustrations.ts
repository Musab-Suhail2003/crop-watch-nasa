import type { CropName, RiskType } from "../types";

/**
 * Picture cut-outs for farmers who read pictures faster than words.
 * Microsoft Fluent Emoji 3D (MIT licence, see public/illustrations/LICENSE.txt),
 * downloaded from github.com/microsoft/fluentui-emoji at commit 1ffb34c on 2026-11-15.
 */
const img = (name: string) => `/illustrations/${name}.png`;

export const ILLUSTRATIONS = {
  thermometer: img("thermometer"),
  rain: img("rain"),
  droplet: img("droplet"),
  sun: img("sun"),
  calendar: img("calendar"),
  seedling: img("seedling"),
  farmer: img("farmer"),
  home: img("home"),
  pin: img("pin"),
  compare: img("compare"),
  climate: img("climate"),
  report: img("report"),
  learn: img("learn"),
  bell: img("bell"),
  tractor: img("tractor"),
  plant: img("plant"),
  warning: img("warning"),
  money: img("money"),
} as const;

/** Wheat uses the "sheaf" picture, rice a rice bowl, berseem (Egyptian clover) a clover leaf. */
export const CROP_IMAGE: Record<CropName, string> = {
  wheat: img("wheat"),
  rice: img("rice"),
  maize: img("maize"),
  mung_bean: img("mung_bean"),
  berseem: img("berseem"),
};

/** Picture for each kind of weather risk (no snowflake in the set, so cold uses sun-behind-cloud). */
export const RISK_IMAGE: Record<RiskType, string> = {
  heat: ILLUSTRATIONS.thermometer,
  cold: ILLUSTRATIONS.climate,
  drought: ILLUSTRATIONS.sun,
  waterlogging: ILLUSTRATIONS.rain,
  disease: ILLUSTRATIONS.warning,
};
