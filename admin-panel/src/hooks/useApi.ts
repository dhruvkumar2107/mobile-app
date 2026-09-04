'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(
  apiFn: () => Promise<{ data: T }>,
  options: UseApiOptions = { immediate: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn();
      setData(response.data);
      return response.data;
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosError.response?.data?.message || axiosError.message || 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [execute, options.immediate]);

  return { data, loading, error, execute, setData };
}
