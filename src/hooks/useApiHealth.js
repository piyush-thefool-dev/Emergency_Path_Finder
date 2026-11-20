/**
 * Keeps the latest result of every API check.
 * Runs once on start, then every 5 minutes while the tab is visible.
 * Public services are shared, so it does not poll faster than that.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_CHECKS, runCheck } from '../services/apiHealth.js';

const AUTO_REFRESH_MS = 5 * 60 * 1000;

const initial = () =>
  Object.fromEntries(API_CHECKS.map((c) => [c.id, { state: 'checking', detail: '', latencyMs: null, checkedAt: null }]));

export function useApiHealth({ tomtomKey = '' } = {}) {
  const [results, setResults] = useState(initial);
  const ctxRef = useRef({ tomtomKey });
  ctxRef.current = { tomtomKey };

  const checkOne = useCallback(async (id) => {
    const check = API_CHECKS.find((c) => c.id === id);
    if (!check) return;
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], state: 'checking' } }));
    const result = await runCheck(check, ctxRef.current);
    setResults((prev) => ({ ...prev, [id]: result }));
  }, []);

  const checkAll = useCallback(async () => {
    setResults((prev) => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, state: 'checking' }])));
    await Promise.all(
      API_CHECKS.map(async (check) => {
        const result = await runCheck(check, ctxRef.current);
        setResults((prev) => ({ ...prev, [check.id]: result }));
      })
    );
  }, []);

  useEffect(() => {
    checkAll();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') checkAll();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [checkAll]);

  // Re-check TomTom when the key changes.
  useEffect(() => {
    checkOne('tomtom');
  }, [tomtomKey, checkOne]);

  const summary = useMemo(() => {
    const values = Object.values(results);
    const count = (s) => values.filter((v) => v.state === s).length;
    const down = count('down');
    const slow = count('slow');
    const checking = count('checking');
    const ok = count('ok');
    const off = count('off');
    const overall = checking === values.length ? 'checking' : down > 0 ? 'down' : slow > 0 ? 'slow' : 'ok';
    return { ok, slow, down, off, checking, total: values.length, overall };
  }, [results]);

  return { results, summary, checkAll, checkOne };
}

export default useApiHealth;
