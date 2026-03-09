import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/user/create/', data),
  login: (data) => api.post('/user/token/', data),
  getProfile: () => api.get('/user/me/'),
  updateProfile: (data) => api.patch('/user/me/', data),
};

export const recipeApi = {
  list: (params) => api.get('/recipe/recipes/', { params }),
  get: (id) => api.get(`/recipe/recipes/${id}/`),
  getPublic: (id) => axios.get(`/api/recipe/recipes/${id}/share/`), // no auth header
  create: (data) => api.post('/recipe/recipes/', data),
  update: (id, data) => api.patch(`/recipe/recipes/${id}/`, data),
  delete: (id) => api.delete(`/recipe/recipes/${id}/`),
  uploadImage: (id, formData) =>
    api.post(`/recipe/recipes/${id}/upload-image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const tagApi = {
  list: (params) => api.get('/recipe/tags/', { params }),
  update: (id, data) => api.patch(`/recipe/tags/${id}/`, data),
  delete: (id) => api.delete(`/recipe/tags/${id}/`),
};

export const ingredientApi = {
  list: (params) => api.get('/recipe/ingredients/', { params }),
  update: (id, data) => api.patch(`/recipe/ingredients/${id}/`, data),
  delete: (id) => api.delete(`/recipe/ingredients/${id}/`),
};

export default api;
