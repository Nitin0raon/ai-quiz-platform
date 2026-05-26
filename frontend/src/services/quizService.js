import api from '../api/axiosInstance'

export const quizService = {
  list: (params) => api.get('/quizzes/', { params }),
  generate: (data) => api.post('/quizzes/generate/', data),
  get: (id) => api.get(`/quizzes/${id}/`),
  getWithAnswers: (id) => api.get(`/quizzes/${id}/?with_answers=true`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit/`, data),
  delete: (id) => api.delete(`/quizzes/${id}/delete/`),
  attempts: (params) => api.get('/quizzes/attempts/', { params }),
  getAttempt: (id) => api.get(`/quizzes/attempts/${id}/`),
}
