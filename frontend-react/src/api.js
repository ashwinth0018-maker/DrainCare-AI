const API_BASE = ''

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed (${res.status})`
    throw new Error(message)
  }

  return data
}

export const api = {
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

  // Bookings
  getBookings: () => request('/bookings'),
  createBooking: (body) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(body) }),

  // Payments
  createPayment: (bookingId) =>
    request(`/bookings/${bookingId}/create-payment`, { method: 'POST' }),
}
