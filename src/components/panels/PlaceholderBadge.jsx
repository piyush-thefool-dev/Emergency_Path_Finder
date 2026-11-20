/**
 * Standardized PlaceholderBadge component with dark mode support.
 */

export function PlaceholderBadge({ text = '[PLACEHOLDER: not measured]', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs ${className}`}
      title="Denotes a placeholder value, pending empirical measurement or validated registry as specified in the report"
    >
      {text}
    </span>
  );
}

export default PlaceholderBadge;
