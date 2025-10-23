export function timeAgo(time: number | string | Date): string {
  const now = new Date();
  const past =
    typeof time === "number"
      ? new Date(time)
      : typeof time === "string"
      ? new Date(time)
      : time;

  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 5) return "Just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay < 30) return `${diffDay} days ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} months ago`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} years ago`;
}
