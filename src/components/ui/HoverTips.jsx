/**
 * Hover tooltips for the whole app.
 *
 * Shows a short description of any button, link, checkbox or dropdown when the
 * mouse rests on it (or when it gets keyboard focus). The text comes from, in order:
 *   1. data-tip, 2. title, 3. aria-label, 4. the TIPS list below (matched by visible text).
 *
 * The browser's own slow `title` bubble is replaced so there is only one tooltip.
 * Touch screens have no hover, so nothing is shown there.
 */

import { useEffect, useState } from 'react';

const SELECTOR =
  'button, a[href], [role="button"], summary, select, input[type="checkbox"], input[type="range"], label[title], [data-tip]';

// Fallback descriptions for controls that only have visible text.
const TIPS = [
  [/^map$/i, 'Live map with your route and road conditions'],
  [/^hospitals$/i, 'Hospital list, ETAs and bed estimates'],
  [/^beds$/i, 'View and edit demo bed estimates'],
  [/^controls$/i, 'Triage category, routing algorithm, weather and API status'],
  [/^more$/i, 'Benchmarks, models, graph explorer and architecture'],
  [/^dashboard$/i, 'Main dispatch screen with the map'],
  [/^benchmark$/i, 'Compare A* and Dijkstra speed'],
  [/^model & evaluation$/i, 'Model accuracy and evaluation results'],
  [/^graph explorer$/i, 'Browse the road graph nodes and links'],
  [/^architecture$/i, 'How the system is built'],
  [/got it/i, 'Close this guide and go back to the map'],
  [/^cancel$/i, 'Close without saving'],
  [/save hospital data/i, 'Save these demo bed estimates'],
  [/reset sample estimates/i, 'Put the original sample bed numbers back'],
  [/edit demo bed estimates/i, 'Open the bed estimate editor'],
  [/run benchmark|run local/i, 'Run the speed test now'],
  [/strict report mode/i, 'Use the exact settings from the project report'],
  [/^(\+|−|-)$/, 'Change this number by one'],
];

function tipFor(el) {
  const explicit = el.getAttribute('data-tip') || el.getAttribute('title');
  if (explicit) return explicit;
  const label = el.getAttribute('aria-label');
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (label && label !== text) return label;
  for (const [re, tip] of TIPS) if (re.test(text)) return tip;
  return '';
}

export function HoverTips() {
  const [tip, setTip] = useState(null); // { text, x, y, below }

  useEffect(() => {
    let timer = null;
    let current = null;

    const hide = () => {
      clearTimeout(timer);
      current = null;
      setTip(null);
    };

    const show = (el, delay) => {
      // Move native title to data-tip so the browser does not show a second bubble.
      const title = el.getAttribute('title');
      if (title) {
        el.setAttribute('data-tip', title);
        el.removeAttribute('title');
        if (!el.getAttribute('aria-label') && !(el.textContent || '').trim()) el.setAttribute('aria-label', title);
      }
      const text = tipFor(el);
      const visible = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text || text === visible) return;

      current = el;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!current || !document.contains(current)) return;
        const r = current.getBoundingClientRect();
        const below = r.top < 56;
        setTip({
          text,
          x: r.left + r.width / 2,
          y: below ? r.bottom + 8 : r.top - 8,
          below,
        });
      }, delay);
    };

    const onOver = (e) => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest?.(SELECTOR);
      if (!el || el === current) return;
      if (el.closest('.map-tip-group, [data-no-tip]')) return;
      if (el.disabled) return;
      show(el, 150);
    };
    const onOut = (e) => {
      if (!current) return;
      const to = e.relatedTarget;
      if (to && current.contains(to)) return;
      hide();
    };
    const onFocus = (e) => {
      const el = e.target.closest?.(SELECTOR);
      if (!el || !el.matches(':focus-visible')) return;
      show(el, 0);
    };

    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointerdown', hide);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointerdown', hide);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  if (!tip) return null;
  const half = Math.min(130, tip.text.length * 3.4 + 12);
  const left = Math.max(half + 8, Math.min(tip.x, window.innerWidth - half - 8));

  return (
    <div
      role="tooltip"
      className="fixed z-[3000] pointer-events-none max-w-[260px] rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold leading-snug px-2.5 py-1.5 shadow-xl text-center"
      style={{ left, top: tip.y, transform: tip.below ? 'translateX(-50%)' : 'translate(-50%, -100%)' }}
    >
      {tip.text}
    </div>
  );
}

export default HoverTips;
