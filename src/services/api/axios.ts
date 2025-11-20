// src/services/api/axios.ts
import axios from 'axios';

// Use empty string for relative paths (Next.js API routes) or external API URL from env
const baseURL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
