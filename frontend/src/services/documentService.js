import api from '../api/axiosInstance'

export const documentService = {
  list: (params) => api.get('/documents/', { params }),

  upload: (formData, onUploadProgress) =>
    api.post('/documents/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),

  get: (id) => api.get(`/documents/${id}/`),
  delete: (id) => api.delete(`/documents/${id}/`),
  reprocess: (id) => api.post(`/documents/${id}/reprocess/`),
}
