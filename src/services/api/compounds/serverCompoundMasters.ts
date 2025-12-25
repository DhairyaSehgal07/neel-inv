// src/services/api/compoundMasters.ts
import { api } from '../axios';

export async function fetchCompoundMasters() {
  try {
    const response = await api.get('/compound-masters');
    return response.data;
  } catch (error) {
    console.error('Server fetch error (compound masters):', error);
    throw new Error('Failed to fetch compound masters');
  }
}

export async function createCompoundMaster(payload: {
  compoundCode: string;
  compoundName: string;
  category: 'skim' | 'cover';
  defaultWeightPerBatch: number;
  rawMaterials?: string[];
}) {
  try {
    const response = await api.post('/compound-masters', payload);
    return response.data;
  } catch (error) {
    console.error('Server error (create compound master):', error);
    throw new Error('Failed to create compound master');
  }
}

export async function updateCompoundMaster(
  id: string,
  payload: {
    compoundCode?: string;
    compoundName?: string;
    category?: 'skim' | 'cover';
    defaultWeightPerBatch?: number;
    rawMaterials?: string[];
  }
) {
  try {
    const response = await api.put(`/compound-masters/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Server error (update compound master):', error);
    throw new Error('Failed to update compound master');
  }
}

export async function deleteCompoundMaster(id: string) {
  try {
    const response = await api.delete(`/compound-masters/${id}`);
    return response.data;
  } catch (error) {
    console.error('Server error (delete compound master):', error);
    throw new Error('Failed to delete compound master');
  }
}