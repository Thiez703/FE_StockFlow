import api from '@/api/axios';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
};
