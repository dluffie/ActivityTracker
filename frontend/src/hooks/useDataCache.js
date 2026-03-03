import { useState, useEffect, useRef, useCallback } from 'react';

// Simple in-memory cache shared across components
const cache = {};

/**
 * Hook that caches API call results to prevent unnecessary re-fetching
 * when switching between tabs/routes.
 * 
 * @param {string} key - Unique cache key (e.g., 'student-dashboard')
 * @param {Function} fetchFn - Async function that fetches data
 * @param {object} options - { staleDuration: ms (default 30000), deps: [] }
 * @returns {{ data, loading, error, refetch }}
 */
export default function useDataCache(key, fetchFn, options = {}) {
    const { staleDuration = 30000, deps = [] } = options;
    const [data, setData] = useState(() => cache[key]?.data ?? null);
    const [loading, setLoading] = useState(() => !cache[key]?.data);
    const [error, setError] = useState(null);
    const fetchRef = useRef(fetchFn);
    fetchRef.current = fetchFn;

    const isCacheValid = useCallback(() => {
        const entry = cache[key];
        if (!entry) return false;
        return (Date.now() - entry.timestamp) < staleDuration;
    }, [key, staleDuration]);

    const fetchData = useCallback(async (force = false) => {
        // Use cache if valid and not forced
        if (!force && isCacheValid()) {
            setData(cache[key].data);
            setLoading(false);
            return;
        }

        // If we have cached data, show it immediately (no loading spinner)
        if (cache[key]?.data) {
            setData(cache[key].data);
            setLoading(false);
        } else {
            setLoading(true);
        }

        try {
            const result = await fetchRef.current();
            cache[key] = {
                data: result,
                timestamp: Date.now(),
            };
            setData(result);
            setError(null);
        } catch (err) {
            setError(err);
            // If we have stale data, keep showing it
            if (!cache[key]?.data) {
                setData(null);
            }
        } finally {
            setLoading(false);
        }
    }, [key, isCacheValid]);

    useEffect(() => {
        fetchData();
    }, [fetchData, ...deps]);

    const refetch = useCallback(() => fetchData(true), [fetchData]);

    return { data, loading, error, refetch };
}
