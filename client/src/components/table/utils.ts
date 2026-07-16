import moment from "moment";

export function getAutoMenuPosition(
  triggerRect: DOMRect,
  menuHeight: number
): { top: number; left: number } {
  const margin = 6;
  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const openUp =
    spaceBelow < menuHeight + margin && triggerRect.top > spaceBelow;
  const top = openUp
    ? triggerRect.top - menuHeight - margin
    : triggerRect.bottom + margin;
  return { top, left: triggerRect.left };
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const then = moment(iso).utcOffset("+06:00");
  const now = moment().utcOffset("+06:00");
  if (then.isSame(now, "day")) return "today";
  const days = now.diff(then, "days");
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = now.diff(then, "weeks");
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"}`;
  const months = now.diff(then, "months");
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = now.diff(then, "years");
  return `${years} year${years === 1 ? "" : "s"}`;
}
