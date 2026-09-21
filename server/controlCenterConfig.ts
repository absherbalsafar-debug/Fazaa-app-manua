export function getAllowedControlCenterOrigins(raw = process.env.CONTROL_CENTER_ORIGIN ?? "") {
  return raw.split(",").map(value => value.trim()).filter(Boolean);
}

export function isAllowedControlCenterOrigin(origin: string, raw = process.env.CONTROL_CENTER_ORIGIN ?? "") {
  return getAllowedControlCenterOrigins(raw).includes(origin);
}
