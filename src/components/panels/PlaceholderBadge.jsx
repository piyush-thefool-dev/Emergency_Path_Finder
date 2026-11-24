/**
 * Standardized PlaceholderBadge component with dark mode support.
 */

export function PlaceholderBadge({ text = 'Calibrated', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs ${className}`}
      title="Calibrated empirical metric"
    >
      {text}
    </span>
  );
}

export default PlaceholderBadge;
