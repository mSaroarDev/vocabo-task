export const MOBILE_MAX = 767;
export const TABLET_MAX = 1023;

export type DeviceType = "mobile" | "tablet" | "desktop";

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
}

export function isTablet(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(
    `(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`
  ).matches;
}

export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(min-width: ${TABLET_MAX + 1}px)`).matches;
}

export function getDeviceType(): DeviceType {
  if (isMobile()) return "mobile";
  if (isTablet()) return "tablet";
  return "desktop";
}
