// src/services/api/compounds/serverCompoundBatches.ts
import { api } from '../axios';

export async function fetchCompoundBatches(params?: {
  compoundCode?: string;
  date?: string;
}) {
  try {
    const searchParams = new URLSearchParams();
    if (params?.compoundCode) {
      searchParams.append('compoundCode', params.compoundCode);
    }
    if (params?.date) {
      searchParams.append('date', params.date);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/api/compounds/batches?${queryString}` : '/api/compounds/batches';

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Server fetch error (compound batches):', error);
    throw new Error('Failed to fetch compound batches');
  }
}
