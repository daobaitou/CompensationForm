import axios from 'axios';

const service = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:3000' : 'http://8.137.122.136',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default service;