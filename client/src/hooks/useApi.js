import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Generic data-fetching hook with loading/error states and auto-refetch on focus.
 * @param {Function} fetchFn - async function that returns axios response
 * @param {object} options - { autoFetch, refreshInterval, deps }
 */
export function useApi(fetchFn, options = {}) {
  const { autoFetch = true, refreshInterval = 0, deps = [] } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMounted = useRef(true);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchFn(...args);
        if (isMounted.current) {
          setData(res.data?.data ?? res.data);
          setLoading(false);
        }
        return res;
      } catch (err) {
        if (isMounted.current) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Something went wrong",
          );
          setLoading(false);
        }
        throw err;
      }
    },
    [fetchFn],
  );

  useEffect(() => {
    isMounted.current = true;
    if (autoFetch) execute();
    return () => {
      isMounted.current = false;
    };
  }, deps);

  // Auto-refresh on window focus
  useEffect(() => {
    if (!autoFetch) return;
    const onFocus = () => execute();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [autoFetch, execute]);

  // Interval refresh
  useEffect(() => {
    if (!refreshInterval || !autoFetch) return;
    const id = setInterval(() => execute(), refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, autoFetch, execute]);

  return { data, loading, error, execute, setData };
}
