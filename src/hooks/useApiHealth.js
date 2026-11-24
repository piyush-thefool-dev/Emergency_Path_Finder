/**
 * Keeps the latest result of every API check.
 * Runs once on start, then every 5 minutes while the tab is visible.
 * Public services are shared, so it does not poll faster than that.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_CHECKS, runCheck } from '../services/apiHealth.js';
import { isOffline, subscribeNetworkStatus } from '../utils/network.js';

const AUTO_REFRESH_MS = 5 * 60 * 1000;

const getOfflineResults = () => ({
  tiles: { state: 'down', detail: 'Offline (No internet connection)', latencyMs: null, checkedAt: Date.now() },
  osrm: { state: 'down', detail: 'Offline (In-memory graph routing active)', latencyMs: null, checkedAt: Date.now() },
  weather: { state: 'down', detail: 'Offline (Manual / model weather active)', latencyMs: null, checkedAt: Date.now() },
  overpass: { state: 'ok', detail: 'Bundled Pan-India & Delhi-NCR High-Fidelity Graph (Active)', latencyMs: null, checkedAt: Date.now() },
  wib: { state: 'ok', detail: 'Bundled Pan-India 280-Hospital Registry (Active)', latencyMs: null, checkedAt: Date.now() },
  tomtom: { state: 'off', detail: 'Offline (Diurnal & incident model active)', latencyMs: null, checkedAt: Date.now() },
  gps: { state: 'ok', detail: 'Device GPS / Local Navigation Active', latencyMs: null, checkedAt: Date.now() },
});

const initial = () =>
  isOffline()
    ? getOfflineResults()
    : Object.fromEntries(API_CHECKS.map((c) => [c.id, { state: 'checking', detail: '', latencyMs: null, checkedAt: null }]));

export function useApiHealth({ tomtomKey = '' } = {}) {
  const [results, setResults] = useState(initial);
  const ctxRef = useRef({ tomtomKey });
  ctxRef.current = { tomtomKey };

  const checkOne = useCallback(async (id) => {
    const check = API_CHECKS.find((c) => c.id === id);
    if (!check) return;
    if (isOffline()) {
      const offlineMap = getOfflineResults();
      if (offlineMap[id]) {
        setResults((prev) => ({ ...prev, [id]: offlineMap[id] }));
        return;
      }
    }
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], state: 'checking' } }));
    const result = await runCheck(check, ctxRef.current);
    setResults((prev) => ({ ...prev, [id]: result }));
  }, []);

  const checkAll = useCallback(async () => {
    if (isOffline()) {
      setResults(getOfflineResults());
      return;
    }
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
      if (document.visibilityState === 'visible' && !isOffline()) checkAll();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [checkAll]);

  // Subscribe to live online / offline network state transitions
  useEffect(() => {
    const unsub = subscribeNetworkStatus((online) => {
      if (online) {
        checkAll();
      } else {
        setResults(getOfflineResults());
      }
    });
    return unsub;
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
