/** Small formatting helpers, so every screen phrases the same thing the same way. */

export const minutes = (mins) => {
  if (mins == null) return '—';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

export const duration = (seconds) => {
  if (!seconds) return '0 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const pct = (n, fallback = '—') => (n == null ? fallback : `${Math.round(n)}%`);

/** "just now" / "2 hours ago" / "12 Mar" — short, and never a bare timestamp. */
export function ago(input) {
  if (!input) return 'never';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return 'never';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const shortDate = (input) => (input
  ? new Date(input).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  : '—');

export const longDate = (input) => (input
  ? new Date(input).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })
  : '—');

/** "Due in 3 days" / "3 days overdue" / "Due today". */
export function dueLabel(input) {
  if (!input) return { text: 'No due date', tone: 'muted', overdue: false };
  const due = new Date(input);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(due);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86400000);
  if (days === 0) return { text: 'Due today', tone: 'warning', overdue: false };
  if (days === 1) return { text: 'Due tomorrow', tone: 'warning', overdue: false };
  if (days < 0) {
    const n = Math.abs(days);
    return { text: `${n} ${n === 1 ? 'day' : 'days'} overdue`, tone: 'danger', overdue: true };
  }
  if (days <= 7) return { text: `Due in ${days} days`, tone: 'default', overdue: false };
  return { text: `Due ${shortDate(input)}`, tone: 'muted', overdue: false };
}

export const gradeLabel = (min, max) => (min === max ? `Grade ${min}` : `Grades ${min}–${max}`);

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many || `${one}s`}`;

/** Fires a browser download for generated text (CSV exports). */
export function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');

/** Strips markdown down to plain text for previews and meta descriptions. */
export const plain = (md = '', limit = 180) => {
  const text = String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
};
