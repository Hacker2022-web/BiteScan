import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' }
});

export async function scanProduct({ role, imageBase64, preset }) {
  const { data } = await api.post('/scan', {
    role,
    image_base64: imageBase64 || null,
    preset: preset || null
  });
  return data;
}

export async function getPresets() {
  const { data } = await api.get('/scan/presets');
  return data.presets;
}

export async function crawlUrl({ url, scanId }) {
  const { data } = await api.post('/crawl', { url, scan_id: scanId });
  return data;
}

export async function generateNotice({ scanId, violationDetails, inspectorName, inspectorBadge, gpsCoordinates }) {
  const { data } = await api.post('/notices/generate', {
    scan_id: scanId,
    violation_details: violationDetails,
    inspector_name: inspectorName || 'Inspector — Consumer Affairs',
    inspector_badge: inspectorBadge || 'CA-2024-0001',
    gps_coordinates: gpsCoordinates || '28.6139°N, 77.2090°E'
  });
  return data;
}

export async function getDashboardStats() {
  const { data } = await api.get('/dashboard/stats');
  return data;
}

export async function getDashboardHistory() {
  const { data } = await api.get('/dashboard/history');
  return data;
}

// TruthIn Food Database Endpoints
export async function getTruthinProducts(category = 'all') {
  const { data } = await api.get(`/truthin/products${category !== 'all' ? `?category=${category}` : ''}`);
  return data.products;
}

export async function getTruthinCategories() {
  const { data } = await api.get('/truthin/categories');
  return data.categories;
}

export async function searchTruthin(query) {
  const { data } = await api.get(`/truthin/search?q=${encodeURIComponent(query)}`);
  return data.results;
}

export async function getTruthinProductById(id) {
  const { data } = await api.get(`/truthin/product/${id}`);
  return data;
}

export default api;
