import { useState, useCallback } from 'react';
import type { ExpenseData } from '@/types';
import { fetchExpenseData } from '@/lib/google-sheets-expense-fetcher';

export function useExpenseData() {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchExpenseData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expense data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData, reset: () => setData(null) };
}
