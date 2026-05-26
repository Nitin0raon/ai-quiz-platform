import api from '../api/axiosInstance'

export const analyticsService = {
  dashboard: () => api.get('/analytics/dashboard/'),
  leaderboard: () => api.get('/analytics/leaderboard/'),
  accuracy: (days = 30) => api.get(`/analytics/accuracy/?days=${days}`),
}
