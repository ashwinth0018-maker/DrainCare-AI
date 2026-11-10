const API_BASE = ''

function getToken() {
  try {
    const stored = localStorage.getItem('draincare_auth')
    if (stored) return JSON.parse(stored).token
  } catch {
    // ignore
  }
  return null
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed (${res.status})`
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  return data
}

export const api = {
  // Auth
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    }).then(async (res) => {
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error((data && data.detail) || 'Login failed')
      }
      return data
    })
  },
  getMe: () => request('/auth/me'),

  // Sensors
  getReadings: () => request('/sensors/readings'),
  simulateReading: () =>
    request('/sensors/simulate', { method: 'POST' }),
  addReading: (body) =>
    request('/sensors/readings', { method: 'POST', body: JSON.stringify(body) }),

  // Alerts
  getAlerts: (includeResolved = false) =>
    request(`/alerts${includeResolved ? '?include_resolved=true' : ''}`),

  // AI
  analyzeReading: (id) => request(`/ai/analyze/${id}`),

  // Bookings (public — existing)
  getBookings: () => request('/bookings'),
  createBooking: (body) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(body) }),

  // Payments (existing PayPal flow)
  createPayment: (bookingId) =>
    request(`/bookings/${bookingId}/create-payment`, { method: 'POST' }),

  // Resident endpoints
  residentStatus: () => request('/resident/status'),
  residentAlerts: () => request('/resident/alerts'),
  residentBookings: () => request('/resident/bookings'),
  residentCreateBooking: (body) =>
    request('/resident/bookings', { method: 'POST', body: JSON.stringify(body) }),

  // Worker endpoints
  workerJobs: () => request('/worker/jobs'),
  workerAcceptJob: (id) =>
    request(`/worker/jobs/${id}/accept`, { method: 'POST' }),
  workerStartProgress: (id) =>
    request(`/worker/jobs/${id}/progress`, { method: 'POST' }),
  workerSolveJob: (id) =>
    request(`/worker/jobs/${id}/solve`, { method: 'POST' }),

  // Admin endpoints
  adminDashboard: () => request('/admin/dashboard'),
  adminMaintenanceRequests: () => request('/admin/maintenance-requests'),
  adminWorkers: () => request('/admin/workers'),
  adminAssignWorker: (bookingId, workerId) =>
    request(`/admin/bookings/${bookingId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ worker_id: workerId }),
    }),
  adminWorkerProgress: () => request('/admin/worker-progress'),
}
