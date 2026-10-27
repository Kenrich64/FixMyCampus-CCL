// Centralized API Client for FixMyCampus

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Standard HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('fixmycampus_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Request Error [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me')
  },
  complaints: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/complaints${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/complaints/${id}`),
    create: (complaintData) => request('/complaints', { method: 'POST', body: JSON.stringify(complaintData) }),
    recommendPriority: (data) => request('/complaints/recommend-priority', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, data) => request(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    updatePriority: (id, data) => request(`/complaints/${id}/priority`, { method: 'PATCH', body: JSON.stringify(data) }),
    assign: (id, data) => request(`/complaints/${id}/assign`, { method: 'PATCH', body: JSON.stringify(data) }),
    addNote: (id, data) => request(`/complaints/${id}/notes`, { method: 'POST', body: JSON.stringify(data) }),
    getHistory: (id) => request(`/complaints/${id}/history`)
  },
  uploads: {
    getPresignedUrl: (fileData) => request('/uploads/presigned-url', { method: 'POST', body: JSON.stringify(fileData) }),
    uploadToS3: async (uploadUrl, file, fileType) => {
      // Direct browser-to-S3 upload via Presigned PUT URL
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileType
        },
        body: file
      });
      if (!response.ok) {
        throw new Error(`Failed to upload file to S3: status ${response.status}`);
      }
      return true;
    },
    confirm: (data) => request('/uploads/confirm', { method: 'POST', body: JSON.stringify(data) })
  },
  dashboard: {
    getStudent: () => request('/dashboard/student'),
    getAdmin: () => request('/dashboard/admin')
  }
};

export default api;
